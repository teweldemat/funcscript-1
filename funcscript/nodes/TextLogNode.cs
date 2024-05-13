using System;
using funcscript.core;
using funcscript.funcs.misc;
using funcscript.model;

namespace funcscript.nodes;

class TextLogNode
{
    private object _source=null;
    public TextLogNode()
    {
    }

    // Value sink that logs input to the console
    public ValueSinkDelegate Text => source =>
    {
        _source = source;
    };

    public SignalListenerDelegate Log => () =>
    {
        var dr = FuncScript.DeepDref(_source);
        Fslogger.DefaultLogger.WriteLine(dr.ToString());
    };
    public SignalListenerDelegate Clear => () =>
    {
        Fslogger.DefaultLogger.Clear();
    };
}

public class CreateTextLogFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {

        var n = new TextLogNode();
        if (pars.Count > 0)
        {
            var source = pars.GetParameter(parent, 0);
            n.Text(source);
        }
        return new ObjectKvc(n);
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