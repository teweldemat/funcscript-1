using System.Text;
using funcscript.funcs.misc;
using funcscript.model;
using NUnit.Framework;

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
              pair[1]->logger(x.response??'empty').log>>s;
              return pair[0];
            },sp.fire);
            done:sp.onfire;
        };
  list_st:store([1]);
  list:list_st.out;
  sections_gpt:list map (s,j)=>
          { 
            c:{
                t:timer(100,false);
                s:store({a:'resp'});
                response:s.out?.a;
                sp:signalpass();
                success:sp.onfire;
                start:t.start;
                t.tick->s.store>>sp.fire;
              };
             return c;
          };
  section_gpt_start:casc(sections_gpt,(s)=>[s.start,s.success]);
  last:sections_gpt[0];
  section_gpt_start.done->logger(last.response??'empty').log;
  app.start->logger().clear>>list_st.store>>section_gpt_start.start;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SignalSourceDelegate((x,y)=>sink.SetSink(x,y))
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
    seq:s1.store>>s2.store>>logger('saved').log;
    //seq.done->logger('saved').log;
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
                start=new SignalSourceDelegate((x,y)=>sink.SetSink(x,y))
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
      t.tick->sp.fire;
      return sp.onfire;
    };
  x->logger('here').log;
  app.start->t.start;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SignalSourceDelegate((x,y)=>sink.SetSink(x,y))
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
  s:store([1]);
  x:s.out map (a)=>{
      t:timer(100,'test');
      sp:signalpass();
      t.tick->sp.fire;
      start:t.start;
      done:sp.onfire;
    };
  c:reduce(x,(a,s)=>{a.done->s; return a.start;},logger('here').log);
  app.start->s.store>>c;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SignalSourceDelegate((x,y)=>sink.SetSink(x,y))
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
  x:s.out map (a)=>{
      t:timer(100,'test');
      sp:signalpass();
      t.tick->sp.fire;
      start:t.start;
      done:sp.onfire;
    };
  sp:signalpass();
  c.done->logger('here').log;
  m:(y)=>{
            start:reduce(y,(a,s)=>{a.done->s; return a.start;},sp.fire);
            done:sp.onfire;
        };
  c:m(x); 
  app.start->s.store>>c.start;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SignalSourceDelegate((x,y)=>sink.SetSink(x,y))
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
  x:s.out map (a)=>{
      t:timer(100,'test');
      sp:signalpass();
      t.tick->sp.fire;
      start:t.start;
      done:sp.onfire;
    };
  
  c.done->logger('here').log;
  m:(y,l)=>{
              sp:signalpass();
              start:reduce(reverse(y),(a,s)=>{
              pair:l(a);
              pair[1]->s; 
              return pair[0];},sp.fire);
            done:sp.onfire;
        };
  c:m(x,(a)=>[a.start,
              {
                v:signalpass();
                a.done->v.fire;
                return v.onfire;
              }]); 
          
  app.start->s.store>>c.start;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SignalSourceDelegate((x,y)=>sink.SetSink(x,y))
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
        app.start->sp.fire;
        return sp.onfire;
  };
  y:x();
  y->logger('there').log;
}";

        var logger = new RefsTest.StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SignalSourceDelegate((x,y)=>sink.SetSink(x,y))
            }
        });
        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        Assert.That(logger.LogText,Is.EqualTo("there\n"));
    }
}