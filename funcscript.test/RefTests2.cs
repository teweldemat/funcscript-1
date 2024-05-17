using System.Text;
using funcscript.funcs.misc;
using funcscript.model;
using NUnit.Framework;
using NUnit.Framework.Internal;

namespace funcscript.test;

public class RefTests2
{
     [Test]
    public void TestSgnalReduce()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
  casc:(list,lamda)=>
        {
            sp:signalpass();
            start:reduce(reverse(list),(x,s)=>{
              pair:lamda(x);
              pair[1]->logger(x.response??'empty')>>s;
              return pair[0];
            },sp);
            done:sp;
        };
  list_st:store([1]);
  list:list_st;
  sections_gpt:list map (s,j)=>
          { 
            c:{
                t:timer(100,false);
                s:store({a:'resp'});
                response:s?.a;
                sp:signalpass();
                success:sp;
                start:t;
                t->s>>sp;
              };
             return c;
          };
  section_gpt_start:casc(sections_gpt,(s)=>[s.start,s.success]);
  last:sections_gpt[0];
  section_gpt_start.done->logger(last.response??'empty');
  app.start->logger().clear>>list_st>>section_gpt_start.start;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });

        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        sink.Signal();

        System.Threading.Thread.Sleep(delay*2*n);
        Assert.That(logger.LogText,Is.EqualTo("resp\nresp\n"));
    }
    [Test]
    public void SigSquenceThenDone()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
    s1:store(1);
    s2:store(2);
    seq:s1>>s2>>logger('saved');
    app.start->seq;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });
        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        Assert.That(logger.LogText,Is.EqualTo("saved\n"));
    }
    
    [Test]
    public void SignalReflect()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
  t:timer(100,'test');
  x:{
      sp:signalpass();
      t->sp;
      return sp;
    };
  x->logger('here');
  app.start->t;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        
        Assert.That(logger.LogText,Is.EqualTo("here\n"));
    }
    
    [Test]
    public void SignalReflect2()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
  s:store([1,2]);
  x:s map (a)=>{
      t:timer(100,'test');
      sp:signalpass();
      t->sp;
      start:t;
      done:sp;
    };
  c:reduce(x,(a,s)=>{a.done->s; return a.start;},logger('here'));
  app.start->s>>c;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        Assert.That(logger.LogText,Is.EqualTo("here\n"));
    }
    
    [Test]
    public void SignalReflect3()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
  s:store([1]);
  x:s map (a)=>{
      t:timer(100,'test');
      sp:signalpass();
      t->sp;
      start:t;
      done:sp;
    };
  sp:signalpass();
  c.done->logger('here');
  m:(y)=>{
            start:reduce(y,(a,s)=>{a.done->s; return a.start;},sp);
            done:sp;
        };
  c:m(x); 
  app.start->s>>c.start;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });

        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        
        Assert.That(logger.LogText,Is.EqualTo("here\n"));
    }
    
    [Test]
    public void SignalReflect4()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
  s:store([1]);
  x:s map (a)=>{
      t:timer(100,'test');
      sp:signalpass();
      t->sp;
      start:t;
      done:sp;
    };
  
  c.done->logger('here');
  m:(y,l)=>{
              sp:signalpass();
              start:reduce(reverse(y),(a,s)=>{
              pair:l(a);
              pair[1]->s; 
              return pair[0];},sp);
            done:sp;
        };
  c:m(x,(a)=>[a.start,
              {
                v:signalpass();
                a.done->v;
                return v;
              }]); 
          
  app.start->s>>c.start;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        
        Assert.That(logger.LogText,Is.EqualTo("here\n"));
    }
    [Test]
    public void SignalReflect5()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
  x:()=>{
        sp:signalpass();
        app.start->sp;
        return sp;
  };
  y:x();
  y->logger('there');
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });
        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        Assert.That(logger.LogText,Is.EqualTo("there\n"));
    }

    [Test]
    public void TestSigSequence()
    {
        // Setup - Create an initial script and environment
        var script = @"
        {
          app.start->logger('here')>>logger('there')
        }";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        
        Assert.That(logger.LogText,Is.EqualTo("here\nthere\n"));

    }
    [Test]
    public void LambdaCompleReferenceIssue()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
  m:(y,l)=>{
            sp:signalpass();
            start:reduce(reverse(y),(a,s,i)=>{
            pair:l(a,len(y)-1-i);
              pair[1]->s; 
              return pair[0];},sp);
            done:sp;
        };
  
  timers:list map (s,j)=>{
      t:timer(100,false);
      start:t;
      success:t;
  };
  
  casc:m(timers, (x,k)=>[x.start>>logger(f'going {k}-{list[k]}'),x.success]).start;
  list_st:store(['a']);
  list:list_st;

  app.start->list_st
    >>logger('one')
    >>casc;
  
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        
        Assert.That(logger.LogText,Is.EqualTo("one\ngoing 0-a\n"));
    }       
    
    [Test]
    public void Text_Example_ExtractCodeFunction()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
  f:(code,lang)=>
  {
    start_marker:f'```{lang}\n';
    markup_start:find(code,start_marker);
    markup_end:if(markup_start!=-1,find(code,'\n```',markup_start+len(start_marker)),-1);
    return 
      if(markup_end=-1 or marksup_start=-1
        ,''
        ,substring(code,markup_start+len(start_marker),markup_end-markup_start-len(start_marker))
    );
  };
  x:store('```csharp\nthe code\n```');
  app.start->x>>logger(f(x,'csharp'));
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        
        Assert.That(logger.LogText,Is.EqualTo("the code\n"));
    }    
    [Test]
    public void Text_Example_ExtractCodeFunction_2()
    {
        var delay = 100;
        var n = 3;
        // Setup - Create an initial script and environment
        var script = @"
{
  f:(code)=>substring(code,1,3);
  x:store('1234');
  app.start->x>>logger(f(x));
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SigSource((x,y)=>sink.SetSink(x,y))
            }
        });
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        
        Assert.That(logger.LogText,Is.EqualTo("234\n"));
    }    
}