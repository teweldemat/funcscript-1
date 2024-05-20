using System.Collections.Concurrent;
using System.Data;
using System.Reflection.Metadata;
using System.Security.AccessControl;

namespace funcscript.model;

public interface ValueReferenceDelegate
{
    object Dref();
    void AddListener(Action listener);
}
public class ListenerCollection
{
    private readonly List<Action> listeners = new List<Action>();

    public void Notify()
    {
        foreach (var l in listeners)
        {
            l.Invoke();
        }
    }

    public void AddListener(Action listener)
    {
        this.listeners.Add(listener);
    }

}
public class ListenerCollectionKvc:ObjectKvc
{
    private readonly List<Action> listeners = new List<Action>();
    public ListenerCollectionKvc() => base.SetVal(this);
    public void Notify()
    {
        foreach (var l in listeners)
        {
            l.Invoke();
        }
    }

    public void AddListener(Action listener)
    {
        this.listeners.Add(listener);
    }

}

public interface ValueSinkDelegate
{
    void SetValueSource(object valSource);
};

public class ValSink : ValueSinkDelegate
{
    private readonly Action<object> _action;
    public ValSink(Action<object> action) => _action = action;
    public void SetValueSource(object valSource) => _action(valSource);
}

public class ValDel:ValueSinkDelegate
{
    private readonly Action<object> _setSink;
    private bool _sourceSet = false;
    public ValDel(Action<object> setSink)
    {
        this._setSink = setSink;
    }

    public void SetValueSource(object valSource)
    {
        if (_sourceSet)
            throw new InvalidOperationException("Data source can't be set twice");
        _setSink(valSource);
        _sourceSet = true;
    }
}

public interface SignalListenerDelegate
{
    void Activate();
}

public class SigSink:SignalListenerDelegate
{
    private readonly Action _setSink;

    public SigSink(Action setSink)
    {
        this._setSink = setSink;
    }

    public void Activate()
    {
        _setSink();
    }
}

public interface SignalSourceDelegate
{
    void SetSource(object listener, object catcher);
}
public class SigSource:SignalSourceDelegate
{
    Action<object, object> _action;

    public SigSource(Action<object, object> action)
    {
        this._action = action;
    }

    public void SetSource(object listener, object catcher)
    {
        _action(listener, catcher);
    }
}


public class ConstantValue : ValueReferenceDelegate
{
    object _val;

    public ConstantValue(object val)
    {
        _val = val;
    }

    public object Dref()
    {
        return _val;
    }

    public bool HasChanges => false;
    public void AddListener(Action listener)
    {
    }

    public void Connect()
    {
        
    }
}

public class VariableValue :ListenerCollection,  ValueReferenceDelegate
{
    object _val;

    public VariableValue()
    {
    }

    public object Val
    {
        set
        {
            _val = value;
            Notify();
        }
    }

    public object Dref()
    {
        return _val;
    }

    public bool HasChanges => false;
    
}

public class SignalSinkInfo
{
    private object _sink = null;
    private object _catch = null;

    public object Sink => _sink;
    public object Catch => _catch;

    public void SetSink(object obj, object c)
    {
        if (_sink != null)
            throw new EvaluateException("Sink can be set only once");
        _sink = obj;
        _catch = c;
    }

    public class ErrorObject
    {
        public String Message { get; set; }
        public String ErrorType { get; set; }
        public String? AdditionalInfo { get; set; }
    }

    public static ConcurrentDictionary<int, ObjectKvc> ThreadErrorObjects =
        new ConcurrentDictionary<int, ObjectKvc>();

    public static ValueReferenceDelegate ErrorDelegate
    {
        get
        {
            ThreadErrorObjects.TryGetValue(System.Threading.Thread.CurrentThread.ManagedThreadId, out var error);
            return new ConstantValue(error);
        }
    }

    public void Signal()
    {
        try
        {
            if(_sink==null)
                return;
            if (FuncScript.Dref(_sink) is SignalListenerDelegate s)
                s.Activate();
            else
                throw new error.EvaluationTimeException("The event sink is not a signal listener");
        }
        catch (Exception ex)
        {
            if (FuncScript.Dref(_catch) is SignalListenerDelegate s)
            {
                ThreadErrorObjects[System.Threading.Thread.CurrentThread.ManagedThreadId] = new ObjectKvc(
                    new ErrorObject()
                    {
                        Message = ex.Message,
                        ErrorType = ex.GetType().ToString(),
                    });
                s.Activate();
                ThreadErrorObjects.TryRemove(System.Threading.Thread.CurrentThread.ManagedThreadId, out _);
            }
            else
            {
                Console.WriteLine($"Unhandled: {ex.Message}");
                throw;
            };
        }
    }

    public void Clear()
    {
        _sink = null;
        _catch = null;
    }
}