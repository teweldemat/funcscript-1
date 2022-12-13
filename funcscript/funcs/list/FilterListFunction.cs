using funcscript.core;
using funcscript.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.list
{
    public class FilterListFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Filter";

        public int Precidence => 0;
        class FilterListFuncPar : IParameterList
        {
            public object X;
            public object I;
            public object this[int index]
            {
                get
                {
                    switch (index)
                    {
                        case 0: return X;
                        case 1: return I;
                    }
                    return null;
                }
            }

            public int Count => 2;
        }
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");
            var par0 = pars[0];
            var par1 = pars[1];
            if (par0 == null)
                return null;
            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: first paramter should be {this.ParName(0)}");
            if (!(par1 is IFsFunction))
                throw new error.TypeMismatchError($"{this.Symbol} function: second paramter should be {this.ParName(1)}");
            var func = par1  as IFsFunction;
            if (func == null)
                throw new error.TypeMismatchError($"{this.Symbol} function: second paramter didn't evaluate to a function");
            var lst = (FsList)par0;
            var res = new List<object>();
            for (int i = 0; i < lst.Data.Length; i++)
            {
                var val = func.Evaluate(parent, new FilterListFuncPar { X = lst.Data[i], I = i });
                if ((val is bool) && (bool)val)
                    res.Add(lst.Data[i]);
            }
            return new FsList(res) ;
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "List";
                case 1:
                    return "Filter Function";
                default:
                    return "";
            }
        }
    }
}
