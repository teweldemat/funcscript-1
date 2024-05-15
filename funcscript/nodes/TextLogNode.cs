using System;
using System.Text;
using funcscript.core;
using funcscript.funcs.misc;
using funcscript.model;

namespace funcscript.nodes;

class TextLogNode:ObjectKvc, ValueSinkDelegate,SignalListenerDelegate
{
    private object _source=null;

    public TextLogNode()
    {
        base.SetVal(this);   
    }
    public void Activate()
    {
        var dr = FuncScript.Dref(_source);
        var sb = new StringBuilder();
        FuncScript.Format(sb,dr,null);
        Fslogger.DefaultLogger.WriteLine(sb.ToString());
    }
    public SignalListenerDelegate Clear =>new SigSink(() =>
    {
        Fslogger.DefaultLogger.Clear();
    });

    public void SetValueSource(object valSource)
    {
        _source = valSource;
    }
}

public class CreateTextLogFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {

        var n = new TextLogNode();
        if (pars.Count > 0)
        {
            var source = pars.GetParameter(parent, 0);
            n.SetValueSource(source);
        }

        return n;
    }

    public string ParName(int index)
    {
        return null; // No parameters for this function
    }

    public int MaxParsCount => 0; // No parameters
    public CallType CallType => CallType.Prefix;
    public string Symbol => "logger";
    public int Precidence => 0;
}