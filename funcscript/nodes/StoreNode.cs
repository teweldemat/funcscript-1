using System.Security.Authentication.ExtendedProtection;
using funcscript.core;
using funcscript.model;
using Newtonsoft.Json.Serialization;

namespace funcscript.nodes;

public class StoreNode:ListenerCollection, ValueReferenceDelegate
{
    private object _value = null;
    private object _source = null;
    private bool _hasChanges = false;

    public ValueSinkDelegate In => val =>
    {
        this._source = val;
    };

    public ValueReferenceDelegate Out => this;
    public SignalListenerDelegate Store => ()=>
    {
        _hasChanges = true;
        var dr = FuncScript.Dref(_source);
        this._value = dr;
        base.Notify();
    };

    public object Dref()
    {
        _hasChanges = false;
        return _value;
    }

    public bool HasChanges => _hasChanges;
}

public class CreateStoreFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        var n = new StoreNode();
        if (pars.Count > 0)
        {
            var source = pars.GetParameter(parent, 0);
            n.In(source);
        }
        return new ObjectKvc(n);      
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