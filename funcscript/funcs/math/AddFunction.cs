using FuncScript.Core;
using FuncScript.Model;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace FuncScript.Functions.Math
{
    public class SumList : FsList
    {
        private IList<FsList> _lists;
        private int _length;
        public SumList(IList<FsList> lists)
        {
            this._lists = lists;
            this._length = lists.Sum(l => l.Length);
        }

        public override object this[int index]
        {
            get
            {
                if (index < 0)
                    return null;
                foreach (var list in _lists)
                {
                    if (index < list.Length)
                        return list[index];
                    index -= list.Length;
                }

                return null;
            }
        }

        public override int Length => _length;
        public override IEnumerator<object> GetEnumerator()
        {
            for (int i = 0; i < _length; i++)
            {
                yield return this[i];
            }
        }
    }
    public class AddFunction : IFsFunction
    {
        public int MaxParsCount => -1;

        public CallType CallType => CallType.Infix;

        public string Symbol => "+";

        public int Precedence => 100;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var ret = EvaluateInteral(pars, (i) =>
            {
                var ret = pars.GetParameter(parent, i);
                return (true, ret);
            });
            return ret;
        }
        object EvaluateInteral(IParameterList pars,Func<int,(bool,object)> getPar)
        {
            bool isNull=true, isInt=false,isLong=false,isDouble=false,isString=false,isList=false;
            bool isKv = false;

            int intTotal = 0;
            long longTotal = 0;
            double doubleTotal = 0;
            StringBuilder stringTotal = null;
            KeyValueCollection kvTotal = null;
            List<FsList> listTotal= new List<FsList>();
            int c = pars.Count;
            for(int i=0;i<c;i++)
            {
                var p = getPar( i);
                if (!p.Item1)
                    return null;
                var d = p.Item2;
                if(isNull)
                {
                    if (d is int)
                    {
                        isNull = false;
                        isInt = true;
                    }
                    else if (d is long)
                    {
                        isNull = false;
                        isLong = true;
                    }
                    else if (d is double)
                    {
                        isNull = false;
                        isDouble = true;
                    }
                    else if (d is String)
                    {
                        isNull = false;
                        isString = true;
                    }
                    else if (d is KeyValueCollection)
                    {
                        isNull = false;
                        isKv = true;
                    }
                    else if (d is FsList)
                    {
                        isNull = false;
                        isList = true;
                    }
                }
                if (isInt)
                {
                    if (d is int)
                    {
                        intTotal += (int)d;
                    }
                    else if (d is long)
                    {
                        isLong = true;
                        isInt = false;
                        longTotal = intTotal;
                    }
                    else if (d is double)
                    {
                        isDouble = true;
                        isInt = false; 
                        doubleTotal = intTotal;
                    }
                    else if (d is String)
                    {
                        isString = true;
                        isInt = false;
                        stringTotal = new StringBuilder(intTotal.ToString());
                    }
                    else if (d is FsList)
                    {
                        isList = true;
                        isInt = false;
                        listTotal = new List<FsList>(new []{ new ArrayFsList(new object[] { intTotal })});
                    }
                }
                if (isLong)
                {
                    if(d is int)
                    {
                        longTotal += (long)(int)d;
                    }
                    else if (d is long)
                    {
                        longTotal += (long)d;
                    }
                    else if (d is double)
                    {
                        isDouble = true;
                        isLong= false;
                        doubleTotal = longTotal;
                    }
                    else if (d is String)
                    {
                        isString = true;
                        isLong = false;
                        stringTotal = new StringBuilder(longTotal.ToString());
                    }

                    else if (d is FsList)
                    {
                        isList = true;
                        isLong = false;
                        listTotal = new List<FsList>(new []{new ArrayFsList(new object[] { longTotal })});
                    }

                    else if (d is KeyValueCollection)
                    {
                        throw new Error.TypeMismatchError($"{this.Symbol}: Keyvalue collection not expected");
                    }

                }
                if (isDouble)
                {
                    if(d is int)
                    {
                        doubleTotal += (double)(int)d;
                    }
                    else if (d is long)
                    {
                        doubleTotal += (double)(long)d;
                    }
                    else if (d is double)
                    {
                        doubleTotal+= (double)d;
                    }
                    else if (d is String)
                    {
                        isString = true;
                        isDouble = false;
                        stringTotal = new StringBuilder(doubleTotal.ToString());
                    }
                    else if (d is FsList)
                    {
                        isList= true;
                        isDouble = false;
                        listTotal = new List<FsList>(new []{new ArrayFsList(new object[] { longTotal})});
                    }

                    else if (d is KeyValueCollection)
                    {
                        throw new Error.TypeMismatchError($"{this.Symbol}: Keyvalue collection not expected");
                    }
                }
                if (isString)
                {
                    if (d is int)
                    {
                        stringTotal.Append(d.ToString());
                    }
                    else if (d is long)
                    {
                        stringTotal.Append(d.ToString());
                    }
                    else if (d is double)
                    {
                        stringTotal.Append(d.ToString());
                    }
                    else if (d is double)
                    {
                        stringTotal.Append(d.ToString());
                    }
                    else if (d is string)
                    {
                        if (stringTotal == null)
                            stringTotal = new StringBuilder();
                        stringTotal.Append((string)d);
                    }
                    else if (d is FsList)
                    {
                        isList = true;
                        isString= false;
                        listTotal = new List<FsList>(new []{new ArrayFsList(new object[] { stringTotal.ToString()})});
                    }
                    else if (d is KeyValueCollection)
                    {
                        throw new Error.TypeMismatchError($"{this.Symbol}: Keyvalue collection not expected");
                    }
                }
                if(isKv)
                {
                    var kv = d as KeyValueCollection;
                    if(kv==null)
                        throw new Error.TypeMismatchError("Keyvalue collection expected");
                    if (kvTotal == null)
                        kvTotal = kv;
                    else
                        kvTotal = KeyValueCollection.Merge(kvTotal, kv);
                }
                if (isList)
                {
                    if (d is FsList lst)
                    {
                        listTotal.Add(lst);
                    }
                    else
                        listTotal.Add(new ArrayFsList(new []{d}));
                }

            }

            if (isList)
            {
                return new SumList(listTotal);
            }
            if (isString)
                return stringTotal.ToString();
            if (isDouble)
                return doubleTotal;
            if (isLong)
                return longTotal;
            if (isInt)
                return intTotal;
            if (isKv)
            {
                return kvTotal;
            }
            return null;
        }

        public string ParName(int index)
        {
            return $"Op {index + 1}";
        }

    }
}
