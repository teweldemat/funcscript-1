using System.Collections.Concurrent;
using System.Data;
using System.Runtime.CompilerServices;
using funcscript.core;
using funcscript.error;

namespace funcscript.model;



public partial class CallRef :ListenerCollection, IFsDataProvider, IParameterList,ValueReferenceDelegate
{
    object[] _vals;

    public object[] Vals => _vals;
    //OPTIMIZATION: the parameters are potentially evaluated twice because the caller need to evaluate
    //them before calling this constructor
    public IFsDataProvider ParentProvider => null;

    private object _drefValue=null;
    private bool _derafed=false;

    
    

    public object Dref()
    {
        lock (_vals)
        {

            if (_derafed)
                return _drefValue;
            
            var f = FuncScript.Dref(_vals[0]);
            if (f is IFsFunction func)
            {
                if (func is IFsDref fdref)
                    _drefValue=fdref.DrefEvaluate(this);
                else
                    throw new error.TypeMismatchError(
                    $"{f.GetType()} deoesn't implment {nameof(IFsDref)} hence can't be used in call reference");
            }

            else if (f is FsList lst)
            {
                var index = this.GetParameter(null, 0);
                object ret;
                if (index is int i)
                {
                    if (i < 0 || i >= lst.Length)
                        ret = null;
                    else
                        ret = FuncScript.Dref(lst[i]);
                }
                else
                    ret = null;

                _drefValue = ret;
            }

            else if (f is KeyValueCollection collection)
            {
                var index = this.GetParameter(null, 0);

                object ret;
                if (index is string key)
                {
                    var kvc = collection;
                    var value = kvc.Get(key.ToLower());
                    ret = FuncScript.Dref(value);
                }
                else
                    ret = null;

                _drefValue=ret;
            }
            else
                throw new error.TypeMismatchError("Target of late evaluated call is neither function, list or kvc");

            _derafed = true;
            return _drefValue;
        }
    }

    public object GetData(string name)
    {
        throw new NotImplementedException();
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

            if (val is ValueReferenceDelegate vr)
            {
                vr.AddListener(new Action(r.DepChanged));
            }
        }
        return r;
    }

    void DepChanged()
    {
        _derafed = false;
        base.Notify();
    }
    public static ValueReferenceDelegate Create(IFsDataProvider provider, object f, object [] pars)
    {
        var r = new CallRef();
        r._vals = new object[pars.Length+1];
        r._vals[0] = f;
        for (int i = 1; i < r._vals.Length; i++)
        {
            r._vals[i] = pars[i-1];
        }

        for (int i=0;i<r._vals.Length;i++)
        {
            var val = r._vals[i];
            if (val is ExpressionFunction expF)
            {
                r._vals[i] = new LambdaWrapper(provider, expF);
            }
            if (val is ValueReferenceDelegate vr)
            {
                vr.AddListener(new Action(r.DepChanged));
            }
        }
        return r;
    }
    

    public int Count => _vals.Length-1;

    public object GetParameter(IFsDataProvider provider, int index)
    {
        return index < 0 || _vals.Length-1 <= index ? null : FuncScript.Dref(_vals[index+1]);
    }
}



