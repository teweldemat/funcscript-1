using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

class SignalPassNode
{
    private SignalSinkInfo _sinks = new SignalSinkInfo();

    public SignalPassNode()
    {
    }

    // Signal to fire the event
    public SignalListenerDelegate Fire => () => _sinks.Signal();

    // Signal source delegate that can be connected to other nodes
    public SignalSourceDelegate OnFire => _sinks.SetSink;
}

public class CreateSignalPassFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        return new ObjectKvc(new SignalPassNode());
    }

    public string ParName(int index) => null;  // No parameters needed

    public int MaxParsCount => 0;  // No parameters for this function
    public CallType CallType => CallType.Prefix;
    public string Symbol => "SignalPass";
    public int Precidence => 0;
}