using System.Collections.Concurrent;
using System.Data;

namespace funcscript.model;

public interface ValueReferenceDelegate
{
    object Dref();
    void AddListener(Action listener);
    void Connect();
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

    public virtual void Connect()
    {
        
    }
    public void AddListener(Action listener)
    {
        this.listeners.Add(listener);
    }

}

public delegate void ValueSinkDelegate(object val);

public delegate void SignalListenerDelegate();

public delegate void SignalSourceDelegate(object listener, object catcher);


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
            if (FuncScript.Dref(_sink) is SignalListenerDelegate s)
                s();
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
                s();
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