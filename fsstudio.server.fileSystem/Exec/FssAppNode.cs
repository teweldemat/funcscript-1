using funcscript.core;
using funcscript.model;
namespace fsstudio.server.fileSystem.exec;

class FssAppNode
{
    private SignalSinkInfo _sinks = new SignalSinkInfo();

    public FssAppNode()
    {
        // Initialization can be added here if necessary.
    }

    // SignalSourceDelegate that allows registration to the signal this node emits
    public SignalSourceDelegate Start =>new SigSource((a,b)=>_sinks.SetSink(a,b));

    // Method to activate the signal, could be used internally or externally to trigger the event
    public void ActivateSignal()
    {
        _sinks.Signal();
    }

    public void ClearSink()
    {
        _sinks.Clear();
    }
}