using funcscript.core;
using funcscript.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.list
{
    public class ReduceListFunction : IFsFunction
    {
        public int MaxParsCount => 3;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Reduce";

        public int Precidence => 0;
        class DoListFuncPar : IParameterList
        {
            public object S;
            public object X;
            public object I;
            public object this[int index]
            {
                get
                {
                    switch (index)
                    {
                        case 0: return X;
                        case 1: return S;
                        case 2: return I;
                    }
                    return null;
                }
            }

            public int Count => 2;
        }
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var par0 = pars[0];
            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: first paramter should be {this.ParName(0)}");

            var func = pars[1] as IFsFunction;
            var total = pars[2];
            var lst = (FsList)par0;
            
            
            for (int i = 0; i < lst.Data.Length; i++)
            {
                total=func.Evaluate(parent, new DoListFuncPar {S=total, X = lst.Data[i], I = i });
            }

            return FuncScript.NormalizeDataType(total);
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "List";
                case 1:
                    return "Transform Function";
                default:
                    return "";
            }
        }
    }
}
