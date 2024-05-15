using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

public class StoreNode :ListenerCollection, ValueReferenceDelegate, ValueSinkDelegate,SignalListenerDelegate
{
    private object _value = null;
    private object _source = null;
    
    public object Dref()
    {
        return _value;
    }
    public void SetValueSource(object valSource)=>_source = valSource;
    public void Activate()
    {
        var dr = FuncScript.Dref(_source);
        this._value = dr;
        base.Notify();
    }
}

public class CreateStoreFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        var n = new StoreNode();
        if (pars.Count > 0)
        {
            var source = pars.GetParameter(parent, 0);
            n.SetValueSource(source);
        }
        return n;      
    }

    public string ParName(int index)
    {
        return null;
    }

    public int MaxParsCount => 0;
    public CallType CallType => CallType.Prefix;
    public string Symbol => "Store";
    public int Precidence => 0;
}