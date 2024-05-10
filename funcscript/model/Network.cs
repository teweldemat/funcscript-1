using System.Collections.Concurrent;
using System.Data;
using System.Runtime.CompilerServices;
using funcscript.core;
using funcscript.error;

namespace funcscript.model;

public delegate object ValueReferenceDelegate();

public delegate void ValueSinkDelegate(object val);

public delegate void SignalListenerDelegate();

public delegate void SignalSourceDelegate(object listener, object catcher);

public class FunctionRef : IFsDataProvider, IParameterList
{
    IFsFunction _func;
    object[] _pars;

    //OPTIMIZATION: the parameters are potentially evaluated twice because the caller need to evaluate
    //them before calling this constructor


    object DRef() =>
        _func.Evaluate(this, this);

    public object GetData(string name)
    {
        throw new NotImplementedException();
    }

    public static ValueReferenceDelegate Create(IFsDataProvider provider, IFsFunction f, IParameterList pars)
    {
        /*
        var r = new FunctionRef();
        r._func = f;
        r._pars = new object[pars.Count];
        for (int i = 0; i < r._pars.Length; i++)
        {
            var val=pars.GetParameter(provider, i);
            if (val is ExpressionFunction expF)
            {
                
            }
            r._pars[i] = val;
        }
        return r.DRef;
        */
        return CallRef.Create(provider, f, pars);
    }

    public int Count => _pars.Length;

    public object GetParameter(IFsDataProvider provider, int index)
    {
        return index < 0 || _pars.Length <= index ? null : FuncScript.Dref(_pars[index]);
    }
}

public class CallRef : IFsDataProvider, IParameterList
{
    object[] _vals;

    public object[] Vals => _vals;
    //OPTIMIZATION: the parameters are potentially evaluated twice because the caller need to evaluate
    //them before calling this constructor


    object DRef()
    {
        var f = FuncScript.Dref(_vals[0]);
        if (f is IFsFunction func)
            return func.Evaluate(this, this);
        if (f is FsList lst)
        {
            var index = this.GetParameter(null, 0);
            object ret;
            if (index is int i)
            {
                if (i < 0 || i >= lst.Length)
                    ret = null;
                else
                    ret = lst[i];
            }
            else
                ret = null;

            return ret;
        }

        if (f is KeyValueCollection collection)
        {
            var index = this.GetParameter(null, 0);

            object ret;
            if (index is string key)
            {
                var kvc = collection;
                var value = kvc.Get(key.ToLower());
                ret = value;
            }
            else
                ret = null;

            return ret;
        }

        throw new error.TypeMismatchError("Target of late evaluated call is neither function, list or kvc");
    }

    public object GetData(string name)
    {
        throw new NotImplementedException();
    }

    public class LambdaWrapper : IFsFunction
    {
        private ExpressionFunction _exp;
        private IFsDataProvider _parent;
        public LambdaWrapper(IFsDataProvider parent, ExpressionFunction exp)
        {
            this._exp = exp;
            this._parent = parent;
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            return _exp.Evaluate(_parent, pars);
        }

        public string ParName(int index) => _exp.ParName(index);

        public int MaxParsCount => _exp.MaxParsCount;
        public CallType CallType => _exp.CallType;
        public string Symbol => _exp.Symbol;
        public int Precidence => _exp.Precidence;
    }
    public static ValueReferenceDelegate Create(IFsDataProvider provider, object f, IParameterList pars)
    {
        var r = new CallRef();
        r._vals = new object[pars.Count+1];
        r._vals[0] = f;
        for (int i = 1; i < r._vals.Length; i++)
        {
            r._vals[i] = pars.GetParameter(provider, i-1);
        }

        for (int i=0;i<r._vals.Length;i++)
        {
            var val = r._vals[i];
            if (val is ExpressionFunction expF)
            {
                r._vals[i] = new LambdaWrapper(provider, expF);
            }
        }
        return r.DRef;
    }
    public static ValueReferenceDelegate Create(object[] vals)
    {
        if (vals.Length < 1)
            throw new InvalidOperationException("At least on val is required for CallRef");
        var r = new CallRef();
        r._vals = vals;
        return r.DRef;
    }

    public int Count => _vals.Length-1;

    public object GetParameter(IFsDataProvider provider, int index)
    {
        return index < 0 || _vals.Length-1 <= index ? null : FuncScript.Dref(_vals[index+1]);
    }
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

    public static ValueReferenceDelegate ErrorDelegate => () =>
    {
        ThreadErrorObjects.TryGetValue(System.Threading.Thread.CurrentThread.ManagedThreadId, out var error);
        return error;
    };

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