using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using funcscript.block;
using funcscript.core;
using funcscript.funcs.misc;
using funcscript.model;
using funcscript.nodes;
using Newtonsoft.Json.Serialization;
using NUnit.Framework;

namespace funcscript.test;

[TestFixture]
public class RefsTest
{


    [Test]
    public void TestNameReference()
    {
        ValueReferenceDelegate v = new ConstantValue(1);

        var res = FuncScript.EvaluateWithVars("x", new { x = v });
        Assert.IsNotNull(res);
        Assert.That(res is ValueReferenceDelegate);
        Assert.That(res is ValueReferenceDelegate);
        var r = (ValueReferenceDelegate)res;
        Assert.That(r.Dref(), Is.EqualTo(1));
    }

    [Test]
    public void TestKvcReference()
    {
        ValueReferenceDelegate v = new ConstantValue(1);
        var res = FuncScript.EvaluateWithVars("{a:x,b:3}", new { x = v });
        Assert.IsNotNull(res);
        Assert.That(res is KeyValueCollection);
        var a = ((KeyValueCollection)res).GetData("a");
        Assert.That(a is ValueReferenceDelegate);
        var r = (ValueReferenceDelegate)a;
        var dr = r.Dref();
        Assert.That(dr is int);
        Assert.That((int)dr, Is.EqualTo(1));
    }

    [Test]
    public void TestListReference()
    {
        ValueReferenceDelegate v = new ConstantValue(1);
        var res = FuncScript.EvaluateWithVars("[x,3]", new { x = v });
        Assert.IsNotNull(res);
        Assert.That(res is FsList);
        var l = (FsList)res;
        Assert.That(l[0] is ValueReferenceDelegate);
        var r = (ValueReferenceDelegate)l[0];
        var dr = r.Dref();
        Assert.That(dr is int);
        var i = (int)dr;
        Assert.That(i, Is.EqualTo(1));
    }
    [Test]
    public void TestConnectionBasic()
    {
        var exp =
            @"
{
    app.start->logger('here').log;    
}
";
        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);

        var sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(exp,new
        {
            app=new
            {
                start=new SignalSourceDelegate((x,y)=>sink.SetSink(x,y))
            }
        });
        Assert.NotNull(res);
        Assert.That(res,Is.AssignableTo<KeyValueCollection>() );
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("here\n"));
    }


    [Test]
    public void TestConnection()
    {
        var exp =
@"
{
    s:Store();
    a:10;
    b:s.Out;
    sig:s.Store;    
    a:->s.In;
}
";
        var res = FuncScript.Evaluate(exp);
        Assert.That(res, Is.AssignableTo<KeyValueCollection>());
        var kvc = (KeyValueCollection)res;
        Assert.That(kvc.GetData("b") is ValueReferenceDelegate);
        var dRef = (ValueReferenceDelegate)kvc.GetData("b");
        Assert.IsNull(dRef.Dref());
        res = kvc.GetData("sig");
        Assert.That(res is SignalListenerDelegate);
        var store = (SignalListenerDelegate)res;
        store();

        Assert.That(dRef.Dref(), Is.EqualTo(10));
    }

    [Test]
    public void TestFileStore()
    {
        var exp =
            @"
{
    s:JsonFileStore();
    x:{a:1,b:'2'};
    sig:s.Save;    
    x:->s.In;
    'test.json':->s.FileName;
}
";
        var val = FuncScript.Evaluate(exp);
        Assert.That(val, Is.AssignableTo<KeyValueCollection>());
        Assert.That(val is KeyValueCollection);
        var kvc = (KeyValueCollection)val;

        val = kvc.GetData("sig");
        Assert.That(val is SignalListenerDelegate);
        var store = (SignalListenerDelegate)val;
        store();

        Assert.That(System.IO.File.Exists("test.json"));
        var eval = FuncScript.Evaluate(System.IO.File.ReadAllText("test.json"));
        Assert.That(eval is KeyValueCollection);

        kvc = (KeyValueCollection)eval;
        Assert.That(kvc.GetData("a"), Is.EqualTo(1));
        Assert.That(kvc.GetData("b"), Is.EqualTo("2"));
    }

    [Test]
    public void TestSignalCount()
    {
        // Setup - Create an initial script and environment
        var script = @"
{
   x:store();
   (x.Out??0)+1:->x.In;
   sig:x.Store;
   count:x.Out;
}";

        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.Evaluate(script);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;

        var _sig = kvc.GetData("sig");
        Assert.NotNull(_sig, "The signal should be correctly set up.");
        Assert.That(_sig is SignalListenerDelegate);
        var sig = (SignalListenerDelegate)_sig;

        var _out = kvc.GetData("count");
        Assert.That(_out is ValueReferenceDelegate);
        var countOut = (ValueReferenceDelegate)_out;

        for (int i = 0; i < 10; i++)
        {
            sig.Invoke();
            Assert.That(countOut.Dref(), Is.EqualTo(i + 1));
        }
    }

    [Test]
    public void ParseSignalSequence()
    {
        var script = @"
        {
            t:timer(1009,true);
            s:t.start>>t.stop;
            return s;            
        }";
        var res = FuncScript.Evaluate(script);
        Assert.That(res, Is.TypeOf<SignalListenerDelegate>());
        var d = (SignalListenerDelegate)res;
        Assert.That(d.Target, Is.TypeOf<SigSequenceNode>());
        var n = (SigSequenceNode)d.Target;
        Assert.That(n.Items.Length, Is.EqualTo(2));
    }

    [Test]
    public void TestHttpNodeStackOverflowBug()
    {
        var script = @"{
  f:(x)=>
  {
      h:httpclient();
      'place holder url':->h.url;
      {'y': x}:->h.InData;
      return h.postjson;
  };
  
  list_gpt:f('place holder');
  app.start->list_gpt;
}";
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
    }
    
    
    
[Test]
    public void TestTimerWithCount()
    {
        // Setup - Create an initial script and environment
        var delay = 300;
        var n = 4;
        var script = $@"
{{
//nodes
   x:store();
   t:timer({delay},true);

//connections
   
   (x.Out??0)+1:->x.In;
   t.tick->if((x.Out??0)={n},t.stop,x.store);
   app.start->t.start;
   count:x.Out;
}}";

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
        
        Assert.That(sink.Sink!=null);
        Assert.That(sink.Catch==null);
        sink.Signal();
        System.Threading.Thread.Sleep(delay*2*n);
        
        var kvc = (KeyValueCollection)res;
        var _count = kvc.GetData("count");
        Assert.That(_count is ValueReferenceDelegate);
        var count = (ValueReferenceDelegate)_count;
        Assert.That( count.Dref(),Is.EqualTo(4));
    }
    
    [Test]
    public void TestSgnalReduce()
    {
        var delay = 100;
        var n = 4;
        // Setup - Create an initial script and environment
        var script = @"
{
    count_st:store();
    count_st.out??0+1:->count_st.In;
    t:series(0,"+n+@") map (i)=>
    {
        x:timer(100,false);
        sp:signalpass();
        start:x.start;
        done:sp.onfire;
        x.tick->count_st.store>>logger('count:'+ count_st.out).log>>sp.fire;
    };
    seq:reverse(t) reduce (x,s,i)=>
    {
        x.done->logger('index:'+i).log>>s;
        return x.start;
    };
    app.start->seq;
    count:count_st.out;
}";

        var logger = new StringTextLogger();
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
        
        var kvc = (KeyValueCollection)res;
        var _count = kvc.GetData("count");
        Assert.That(_count is ValueReferenceDelegate);
        var count = (ValueReferenceDelegate)_count;
        Assert.That( count.Dref(),Is.EqualTo(n));
        
        StringBuilder sb = new StringBuilder();
        int startCount = 1;
        int endIndex = n; // Adjust this to control the number of lines

        for (int i = endIndex - 1; i >= 0; i--)
        {
            sb.AppendLine($"count:{startCount}");
            sb.AppendLine($"index:{i}");
            startCount++;
        }
        Assert.That(logger.LogText,Is.EqualTo(sb.ToString()));
    }
    [Test]
    public void TestSigLink()
    {
        // Setup - Create an initial script and environment
        var script = @"{
     t:timer(1000,true);
    t.tick->t.stop;
}";

        var res = FuncScript.Evaluate(script);
        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        
    }

    public class StringTextLogger : funcscript.funcs.misc.Fslogger
    {
        private StringBuilder sb = new StringBuilder();
        public override void WriteLine(string text)
        {
            sb.AppendLine(text);
        }

        public override void Clear()
        {
            sb.Clear();
        }

        public string LogText => sb.ToString();
    }

    [Test]
    public void TestErrorPathParse()
    {
        var script = @"
{
   x:1;
   app.start->logger('all good').log|logger('error').log;
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("all good\n"));
    }
    
    [Test]
    public void TestErrorPathParse2()
    {
        var script = @"
{
    s:store();
    (s.out/0):->s.in;
    app.start->logger('all good').log>>s.store|logger('error').log;
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res is KeyValueCollection);

        Assert.That(sink.Sink != null);
        Assert.That(sink.Catch == null);
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("all good\nerror\n"));
    }
    [Test]
    public void TestErrorPathParse3()
    {
        var script = @"
{
    s:store();
    (s.out/1):->s.in;
    app.start->logger('all good').log>>s.store|logger('error').log>>logger('final').log;
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res is KeyValueCollection);

        Assert.That(sink.Sink != null);
        Assert.That(sink.Catch == null);
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("all good\nfinal\n"));
    }
    [Test]
    public void TestErrorPathParse4()
    {
        var script = @"
{
    s:store();
    (s.out/0):->s.in;
    app.start->logger('all good').log>>s.store|logger('error').log>>logger('final').log;
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("all good\nerror\nfinal\n"));
    }
    
    [Test]
    public void TesConnectionOnlyKVCExpression()
    {
        var script = @"
{
   app.start->logger('all good').log;
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res,Is.AssignableTo<KeyValueCollection>());

        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);

        Assert.That(sink.Sink != null);
        Assert.That(sink.Catch == null);
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("all good\n"));
    }
    
    [Test]
    public void TestErrorPath()
    {
        var script = @"
{
   x:store();
   x.Out/0:->x.In;
   app.start->x.store|logger('error').log;
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });

        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("error\n"));
    }

    
    [Test]
    public void TestPreEvaluatedLambda()
    {
        var script = @"
{
   x:store();
   [1,2,3]:->x.In;
   app.start->x.store>>logger(x.Out map (y)=>y+1).log;
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        Assert.That(logger.LogText,Is.EqualTo("[2,3,4]\n"));
    }
    
    [Test]
    public void RefBugMay11()
    {
        //the bug is c.Out.x unnecessarily dereferenced 
        var script = @"{
        y:{
            c:store({a:5});
            t:timer(200,false);
            t.tick->c.store>>logger(y.c.out.a).log;
        };
        app.start->y.t.start;
    }";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });

        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        sink.Signal();
        System.Threading.Thread.Sleep(1000);
        Assert.That(logger.LogText,Is.EqualTo("5\n"));
    }
    [Test]
    public void RefBugMay11Case6()
    {
        //the bug is c.Out.x unnecessarily dereferenced 
        var script = @"{
        y:{
            c:5;
            app.start->logger(y.c).log;
        };
    }";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });

        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        sink.Signal();
        System.Threading.Thread.Sleep(1000);
        Assert.That(logger.LogText,Is.EqualTo("5\n"));
    }
    [Test]
    public void RefBugMay11Case2()
    {
        //the bug is c.Out.x unnecessarily dereferenced 
        var script = @"{
        y:{
            c:store({a:5});
            t:timer(200,false);
            t.tick->sigsequence([c.store,logger(y.c.out.a).log]);
        };
        app.start->y.t.start;
    }";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });

        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        sink.Signal();
        System.Threading.Thread.Sleep(1000);
        Assert.That(logger.LogText,Is.EqualTo("5\n"));
    }
    [Test]
    public void RefBugMay11Case4()
    {
        //the bug is c.Out.x unnecessarily dereferenced 
        var script = @"{
  x:{
      t:timer(100,false);
      s:store({a:5});
      b:s.out.a;
      t.tick->(s.store>>logger(x.s.out.a).log);
      return {t,s};
  };
  app.start->x.t.start;
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var vars = new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        };
        var provider = new KvcProvider(new ObjectKvc(vars), new DefaultFsDataProvider());
        var errors = new List<FuncScriptParser.SyntaxErrorData>();
        var exp=FuncScriptParser.Parse(provider, script, errors);
        Assert.NotNull(exp);
        Assert.That(exp is KvcExpression);
        var kvcExp = (KvcExpression)exp;
        Assert.That(kvcExp._keyValues.Count,Is.EqualTo(1));
        Assert.That(kvcExp._keyValues[0].ValueExpression,Is.TypeOf<KvcExpression>());
        kvcExp = (KvcExpression)kvcExp._keyValues[0].ValueExpression;
        Assert.That(kvcExp._keyValues.Count,Is.EqualTo(3));
        Assert.That(kvcExp._signalConnections.Count,Is.EqualTo(1));
        Assert.IsNotNull(kvcExp.singleReturn);
        List<Action> connectionActions = new List<Action>();
        var (res,_) = exp.Evaluate(provider,connectionActions);
        foreach (var con in connectionActions)
        {   
            con.Invoke();
        }
        
        Assert.That(res,Is.AssignableTo<KeyValueCollection>());

        var delVal = (KeyValueCollection)res;
        Assert.That(delVal.IsDefined("x"));
        var _xdel = delVal.GetData("x");
        Assert.That(_xdel,Is.AssignableTo<KeyValueCollection>());
       
        
        sink.Signal();
        System.Threading.Thread.Sleep(1000);
        Assert.That(logger.LogText,Is.EqualTo("5\n"));
    }
    [Test]
    public void RefBugMay11Case5()
    {
        //the bug is c.Out.x unnecessarily dereferenced 
        var script = @"{
  x:{
      t:timer(100,false);
      s:store({a:5});
      b:s.out.a;
      t.tick->s.store;
      return {t,s};
  };
  app.start->x.t.start;
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var vars = new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        };
        var provider = new KvcProvider(new ObjectKvc(vars), new DefaultFsDataProvider());
        var errors = new List<FuncScriptParser.SyntaxErrorData>();
        var exp=FuncScriptParser.Parse(provider, script, errors);
        Assert.NotNull(exp);
        Assert.That(exp is KvcExpression);
        var kvcExp = (KvcExpression)exp;
        Assert.That(kvcExp._keyValues.Count,Is.EqualTo(1));
        Assert.That(kvcExp._keyValues[0].ValueExpression,Is.TypeOf<KvcExpression>());
        kvcExp = (KvcExpression)kvcExp._keyValues[0].ValueExpression;
        Assert.That(kvcExp._keyValues.Count,Is.EqualTo(3));
        Assert.That(kvcExp._signalConnections.Count,Is.EqualTo(1));
        Assert.IsNotNull(kvcExp.singleReturn);

        var connections = new List<Action>();
        var (res,_) = exp.Evaluate(provider,connections);
        foreach (var con in connections)
        {
            con.Invoke();
        }
        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        
        var delVal = (KeyValueCollection)res;
        Assert.That(delVal.IsDefined("x"));
        var _xdel = delVal.GetData("x");
        Assert.That(_xdel,Is.AssignableTo<KeyValueCollection>());
       
        sink.Signal();
        System.Threading.Thread.Sleep(1000);
    }
    [Test]
    public void RefBugMay11Case3()
    {
        //the bug is c.Out.x unnecessarily dereferenced 
        var script = @"{
        y:{
            c:store({a:5});
            t:timer(200,false);
            t.tick->sigsequence([c.store]+[logger(y.c.out.a).log]);
        };
        app.start->y.t.start;
    }";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });

        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        sink.Signal();
        System.Threading.Thread.Sleep(1000);
        Assert.That(logger.LogText,Is.EqualTo("5\n"));
    }
    [Test]
    public void RefBugMay10()
    {
        //the bug is c.Out.x unnecessarily dereferenced 
        var script = @"
{
  a:store(5);
  b:if(a.Out>0,
      {
        c:store(0);
        d:c.Out.x;
      },null);
  
   app.start->a.store>>(logger(a.Out).log
   >>b.c.store|logger('fail').log>>logger('term').log);
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });

        Assert.That(res,Is.AssignableTo<KeyValueCollection>());
        sink.Signal();
        Assert.That(logger.LogText,Is.EqualTo("5\nterm\n"));
    }
    [Test]
    public void TestPreEvaluatedLambda2()
    {
        var script = @"
{
  x:5;
  list_st:store(['42','Dont panic']);
  list:list_st.out;
  app.start->list_st.store
   >>logger(list map (s)=>x).log | logger('fail').log
}";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        Assert.That(logger.LogText,Is.EqualTo("[5,5]\n"));
    }
    [Test]
    public void TestSignalDref()
    {
        var script = @"
        {
            s:store();
            10:->s.In;
            a:s.store>>if(s.Out=10,logger('good').log,logger('bad').log);
            app.start->a;
        }";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        
        var kvc = (KeyValueCollection)res;
        var a = kvc!.GetData("s");
        Assert.That(a,Is.TypeOf<ObjectKvc>());
        var _s = (ObjectKvc)a;
        Assert.That(_s.GetUnderlyingValue(),Is.TypeOf<StoreNode>());
        var s = (StoreNode)_s.GetUnderlyingValue();
        Assert.That(s.Out.Dref(),Is.EqualTo(10));
        
        Assert.That(logger.LogText, Is.EqualTo("good\n"));
    }
    
    [Test]
    public void TestRefMap()
    {
        var script = @"
        {
            s:series(0,3) map (x)=>store(x);
            app.start->logger((s map (x)=>x.Out)).log;
        }";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        Assert.That(logger.LogText.Replace(" ",""), Is.EqualTo("[null,null,null]\n"));
    }
    [Test]
    public void TestRefMap2()
    {
        var script = @"
        {
            s:series(0,3) map (x)=>store(x);
            app.start->SigSequence(s map (x)=>x.store)>>logger((s map (x)=>x.Out) join '\n').log;
        }";

        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("0\n1\n2\n"));
    }
    [Test]
    public void RefBugMay12Case2()
    {
        //the bug is c.Out.x unnecessarily dereferenced 
        var script = @"
{
  y:{
      h:store();
      t:timer(100,false);
      'chat/completions':->h.In;
  };
  y.t.tick->logger('test').log;
}";

        SignalSinkInfo sink = new SignalSinkInfo();
        var res = FuncScript.EvaluateWithVars(script, new
        {
            app = new
            {
                start = new SignalSourceDelegate((x, y) => sink.SetSink(x, y))
            }
        });
        Assert.That(res is KeyValueCollection);
        var kvc = res as KeyValueCollection;
        var y = kvc.GetData("y") as KeyValueCollection;
        Assert.NotNull(y);
        
    }
    
    [Test]
    public void TestSignalPass()
    {
        var script = 
@"{
    sp:SignalPass();
    sp.OnFire->logger('passed').log;
    app.start->sp.Fire;
}";
        var logger = new StringTextLogger();
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
        System.Threading.Thread.Sleep(2000);
        Assert.That(logger.LogText, Is.EqualTo("passed\n"));
    }
    [Test]
    public void May12Bug2()
    {
        var script = @"{
    list_store:store(5);  
    list:list_store.Out;
    sections_gpt:if(list>0,
          { 
              c:{
                  t:timer(100,false);
                  s:store({a:'resp'});
                  sp:SignalPass();
                  success:sp.OnFire;  
                  start:t.start;
                  response:s.out.a;
                  t.tick->s.store>>sp.fire;
              };
              c.success->logger('done').log
                  >>logger(sections_gpt.response).log
                    |logger(fault.message).log;
             return c;
          },null);
    section_gpt_start:sigsequence([sections_gpt] map (x)=>x.start);

    app.start->logger().clear>>list_store.store
     >>sections_gpt.start;

}";
        var logger = new StringTextLogger();
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
        System.Threading.Thread.Sleep(2000);
        Assert.That(logger.LogText, Is.EqualTo("done\nresp\n"));
    }

    
    [Test]
    public void May12Bug2Reduce1()
    {
        var script = @"{
    list_store:store(5);  
    list:list_store.Out;
    sections_gpt:if(list>0,
          { 
              c:timer(100,false);
              return c;
          },null);
    
    app.start->list_store.store
     >>sections_gpt.start;

}";
        var logger = new StringTextLogger();
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
    }
    
    [Test]
    public void DeepReferenceBugIssue()
    {
        //reality struck, mixing mutable with immutable might not work after all
        var script = 
@"{
  list_store:store(['item1']);  
  list:list_store.Out;

  sections_gpt:list map (s)=>
          { 
              c:{
                  r_st:store({a:'resp'});
                  t:timer(100,false);
                  sp:signalpass();
                  response:r_st.out.a;
                  success:sp.onfire;
                  t.tick->r_st.store>>sp.fire;
                  start:t.start;
              };
              c.success->logger(sections_gpt[0].response).log;
             return c;
          };

  app.start->list_store.store>>sections_gpt[0].start;

}";
        var logger = new StringTextLogger();
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
        System.Threading.Thread.Sleep(2000);
        Assert.That(logger.LogText, Is.EqualTo("resp\n"));

    }
    [Test]
    public void DeepReferenceBugReduce2()
    {
        //reality struck, mixing mutable with immutable might not work after all
        var script = 
@"{
  list_store:store(5);  
  list:list_store.Out;

  sections_gpt:if(list>0,
          { 
              c:{
                  r_st:store({a:'resp'});
                  t:timer(100,false);
                  sp:signalpass();
                  response:r_st.out.a;
                  success:sp.onfire;
                  t.tick->r_st.store>>sp.fire;
                  start:t.start;
              };
              c.success->logger(sections_gpt.response).log;
             return c;
          },null);

  app.start->list_store.store>>sections_gpt.start;

}";
        var logger = new StringTextLogger();
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
        System.Threading.Thread.Sleep(2000);
        Assert.That(logger.LogText, Is.EqualTo("resp\n"));

    }
    
    [Test]
    public void DeepReferenceBugIssueReduce1()
    {
        var script = 
@"{
  list_store:store(['item1']);  
  list:list_store.Out;
  seq:list map (s)=>
          { 
              c:{
                  t:timer(100,false);
                  start:t.start;
                  t.tick->logger('tick').log;
              };
             return c;
          };
  
  app.start->logger().clear
     >>list_store.store>>seq[0].start;

}";
        var logger = new StringTextLogger();
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
        
        Assert.That(sink.Sink!=null);
        Assert.That(sink.Catch==null);
        sink.Signal();
        
        System.Threading.Thread.Sleep(2000);
        Assert.That(logger.LogText, Is.EqualTo("tick\n"));

    }
    
    [Test]
    public void BugMay12_2()
    {
        var script = 
            @"{
  list_st:store([1]);
  list:list_st.out;
  m:list map (s,j)=>1;
  m[len(m)-1].success->logger('final').log;  
}";
        var _res = FuncScript.Evaluate(script);
        var res = FuncScript.Dref(_res);
        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);
    }
    
    [Test]
    public void BugMay12_3()
    {
        var script = 
            @"{
  list_st:store([1]);
  list:list_st.out;
  sections_gpt:list map (s,j)=>
          { 
            c:{
                t:timer(100,false);
                s:store({a:'resp'});
                response:s.out.a;
                sp:signalpass();
                success:sp.onfire;
                start:t.start;
                t.tick->s.store>>sp.fire;
              };
             c.success->logger(sections_gpt map (s,j)=>s.response).log;
             return c;
          };

  app.start->logger().clear>>list_st.store>>sections_gpt[0].start;
  
}";
        var logger = new StringTextLogger();
        Fslogger.SetDefaultLogger(logger);
        SignalSinkInfo sink = new SignalSinkInfo();
        // Evaluate the script to initialize the environment and store object
        var _res = FuncScript.EvaluateWithVars(script,new
        {
            app=new
            {
                start=new SignalSourceDelegate((x,y)=>sink.SetSink(x,y))
            }
        });

        var res = FuncScript.Dref(_res);

        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);
        
        Assert.That(sink.Sink!=null);
        Assert.That(sink.Catch==null);
        sink.Signal();
        
        System.Threading.Thread.Sleep(2000);
        Assert.That(logger.LogText.Replace(" ",""), Is.EqualTo("[resp]\n"));

    }
}