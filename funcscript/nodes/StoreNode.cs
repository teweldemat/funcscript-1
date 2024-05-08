using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

class StoreNode
{
    private object _value = null;
    private object _source = null;
        

    public ValueSinkDelegate In => val =>
    {
        this._source = val;
    };
    public ValueReferenceDelegate Out => ()=>this._value;
    public SignalListenerDelegate Store => ()=>
    {
        var dr = FuncScript.Dref(_source);
        this._value = dr;
    };
        
}

public class CreateStoreFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        return new ObjectKvc(new StoreNode());      
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