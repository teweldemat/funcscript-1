using System;
using System.Text;
using funcscript;
using funcscript.core;
using funcscript.funcs.misc;
using funcscript.model;

namespace fsstudio.server.fileSystem.exec.funcs;

class MarkdownNode(RemoteLogger logger) : SignalListenerDelegate,ValueSinkDelegate
{
    private object _source = null;

    public void Activate()
    {
        var dr = FuncScript.Dref(_source);
        var sb = new StringBuilder();
        FuncScript.Format(sb, dr);
        logger.SendMessage("markdown", sb.ToString());
    }

    public void SetValueSource(object valSource)
    {
        _source = valSource;
    }
}

public class CreateMarkdownNodeFunction(RemoteLogger logger) : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        var n = new MarkdownNode(logger);
        if (pars.Count > 0)
        {
            var source = pars.GetParameter(parent, 0);
            n.SetValueSource(source);
        }

        return n;
    }

    public string ParName(int index)
    {
        switch(index)
        {
            case 0:
                return "Markdown Source";
            default:
                return null; // Only one parameter expected
        }
    }

    public int MaxParsCount => 1; // Accepting one parameter for the markdown source
    public CallType CallType => CallType.Prefix;
    public string Symbol => "markdown";
    public int Precidence => 0;
}