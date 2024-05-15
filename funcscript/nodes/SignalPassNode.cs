using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

class SignalPassNode:SignalListenerDelegate,SignalSourceDelegate
{
    private SignalSinkInfo _sinks = new SignalSinkInfo();
    public void Activate() => _sinks.Signal();
    public void SetSource(object listener, object catcher)=>_sinks.SetSink(listener,catcher);
}

public class CreateSignalPassFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        return new SignalPassNode();
    }

    public string ParName(int index) => null;  // No parameters needed

    public int MaxParsCount => 0;  // No parameters for this function
    public CallType CallType => CallType.Prefix;
    public string Symbol => "SignalPass";
    public int Precidence => 0;
}