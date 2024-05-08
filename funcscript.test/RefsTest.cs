using System.Runtime.CompilerServices;
using System.Text;
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
        ValueReferenceDelegate v = ()=>1;
        
        var res=FuncScript.EvaluateWithVars( "x", new { x = v });
        Assert.IsNotNull(res);
        Assert.That(res is ValueReferenceDelegate);
        Assert.That(res is ValueReferenceDelegate);
        var r = (ValueReferenceDelegate)res;
        Assert.That(r(),Is.EqualTo(1));
    }
    [Test]
    public void TestKvcReference()
    {
        ValueReferenceDelegate v = ()=>1;
        var res=FuncScript.EvaluateWithVars( "{a:x,b:3}", new { x = v });
        Assert.IsNotNull(res);
        Assert.That(res is KeyValueCollection);
        var a = ((KeyValueCollection)res).Get("a");
        Assert.That(a is ValueReferenceDelegate);
        var r = (ValueReferenceDelegate)a;
        var dr = r();
        Assert.That(dr is int);
        Assert.That((int)dr,Is.EqualTo(1));
    }
    [Test]
    public void TestListReference()
    {
        ValueReferenceDelegate v = ()=>1;
        var res=FuncScript.EvaluateWithVars( "[x,3]", new { x = v });
        Assert.IsNotNull(res);
        Assert.That(res is FsList);
        var l = (FsList)res;
        Assert.That(l[0] is ValueReferenceDelegate);
        var r = (ValueReferenceDelegate)l[0];
        var dr = r();
        Assert.That(dr is int);
        var i= (int)dr;
        Assert.That(i,Is.EqualTo(1));
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
    a->s.In;
}
";
        var res = FuncScript.Evaluate(exp);
        Assert.NotNull(res);
        //Assert.That(res is IValRef);
       // var r = (IValRef)res;
       var _val = res;
        Assert.That(_val is KeyValueCollection);
        var kvc = (KeyValueCollection)_val;
        Assert.That(kvc.Get("b") is ValueReferenceDelegate);
        var dRef = (ValueReferenceDelegate)kvc.Get("b");
        Assert.IsNull(dRef());
        _val = kvc.Get("sig");
        Assert.That(_val is SignalListenerDelegate);
        var store = (SignalListenerDelegate)_val;
        store();
        
        Assert.That(dRef(),Is.EqualTo(10));
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
    x->s.In;
    'test.json'->s.FileName;
}
";
        var res = FuncScript.Evaluate(exp);
        Assert.NotNull(res);

        var _val = res;
        Assert.That(_val is KeyValueCollection);
        var kvc = (KeyValueCollection)_val;

        _val = kvc.Get("sig");
        Assert.That(_val is SignalListenerDelegate);
        var store = (SignalListenerDelegate)_val;
        store();
        
        Assert.That(System.IO.File.Exists("test.json"));
        var eval = FuncScript.Evaluate(System.IO.File.ReadAllText("test.json"));
        Assert.That(eval is KeyValueCollection); 
        
        kvc = (KeyValueCollection)eval;
        Assert.That(kvc.Get("a"),Is.EqualTo(1));
        Assert.That(kvc.Get("b"),Is.EqualTo("2"));
    }
    [Test]
    public void TestSignalCount()
    {
        // Setup - Create an initial script and environment
        var script = @"
{
   x:store();
   (x.Out??0)+1->x.In;
   sig:x.Store;
   count:x.Out;
}";

        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.Evaluate(script);
        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        
        var _sig = kvc.Get("sig");
        Assert.NotNull(_sig, "The signal should be correctly set up.");
        Assert.That(_sig is SignalListenerDelegate);
        var sig = (SignalListenerDelegate)_sig;

        var _out = kvc.Get("count");
        Assert.That(_out is ValueReferenceDelegate);
        var countOut=(ValueReferenceDelegate)_out;
        
        for (int i = 0; i < 10; i++)
        {
            sig.Invoke();
            Assert.That(countOut(),Is.EqualTo(i+1));
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
        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is SigSequenceFunction.SigSequenceNode);
        var n = (SigSequenceFunction.SigSequenceNode)res;
        Assert.That(n.Items.Length,Is.EqualTo(2));
    }
    [Test]
    public void TestTimerWithCount()
    {
        // Setup - Create an initial script and environment
        var script = @"
{
//nodes
   x:store();
   t:timer(1000,true);
   c:TextLog();

//connections
   
   x.Out??'Nothing'->c.Text;
   (x.Out??0)+1->x.In;
   t.tick->c.WriteLine>>if(x.Out??0=5,t.stop,x.store);
   app.start->t.start;
   count:x.Out;
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
        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);
        
        Assert.That(sink.Sink!=null);
        Assert.That(sink.Catch==null);
        sink.Signal();
        System.Threading.Thread.Sleep(7000);
        
        var kvc = (KeyValueCollection)res;
        var _count = kvc.Get("count");
        Assert.That(_count is ValueReferenceDelegate);
        var count = (ValueReferenceDelegate)_count;
        Assert.That( count.Invoke(),Is.EqualTo(5));
    }
    [Test]
    public void TestSigLink()
    {
        // Setup - Create an initial script and environment
        var script = @"{
     t:timer(1000,true);
    t.tick->t.stop;
}";

        // Evaluate the script to initialize the environment and store object
        var res = FuncScript.Evaluate(script);
        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        
    }

    class StringTextLogger : funcscript.funcs.misc.Fslogger
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
   app.start->textlog('all good').writeline|textlog('error').writeline;
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
        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);

        Assert.That(sink.Sink != null);
        Assert.That(sink.Catch != null);
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("all good\n"));
    }
    
    [Test]
    public void TestErrorPath()
    {
        var script = @"
{
   x:store();
   x.Out/0->x.In;
   app.start->x.store|textlog('error').writeline;
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
        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);

        Assert.That(sink.Sink != null);
        Assert.That(sink.Catch != null);
        sink.Signal();
        Assert.That(logger.LogText, Is.EqualTo("error\n"));
    }

    
    [Test]
    public void TestPreEvaluatedLamnda()
    {
        var script = @"
{
   x:store();
   [1,2,3]->x.In;
   app.start->x.store>>textlog(x.Out map (y)=>y+1).writeline;
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
        Assert.NotNull(res, "The environment should be correctly initialized.");
        Assert.That(res is KeyValueCollection);
        sink.Signal();
        Assert.That(logger.LogText,Is.EqualTo("[2,3,4]\n"));
    }
}