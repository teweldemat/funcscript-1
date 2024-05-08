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

            public int Count => 3;

            public object GetParameter(IFsDataProvider provider, int index)
            {
                return index switch
                {
                    0 => X,
                    1 => S,
                    2 => I,
                    _ => null,
                };
            }
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var par0 = pars.GetParameter(parent, 0);

            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: The first parameter should be {this.ParName(0)}");

            var func = pars.GetParameter(parent, 1) as IFsFunction;

            if (func == null)
                throw new error.TypeMismatchError($"{this.Symbol} function: The second parameter didn't evaluate to a function");

            var total = pars.GetParameter(parent, 2);

            var lst = (FsList)par0;

            for (int i = 0; i < lst.Length; i++)
            {
                total = func.Evaluate(parent, new DoListFuncPar { S = total, X = lst[i], I = i });
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
