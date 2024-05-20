using funcscript.core;
using funcscript.model;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.list
{
    public class AnyMatchFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Dual;

        public string Symbol => "Any";

        public int Precidence => 0;
        class DoListFuncPar : IParameterList
        {
            public object X;
            public object I;

            public override int Count => 2;

            public override (object,CodeLocation) GetParameterWithLocation(IFsDataProvider provider, int index)
            {
                switch (index)
                {
                    case 0:
                        return (X,null);
                    case 1:
                        return (I,null);
                    default:
                        return (null,null);
                }
            }
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.GetParameter(parent, 1);

            if (par0 == null)
                return false;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: The first parameter should be {this.ParName(0)}");

            if (!(par1 is IFsFunction))
                throw new error.TypeMismatchError($"{this.Symbol} function: The second parameter should be {this.ParName(1)}");

            var func = par1 as IFsFunction;

            if (func == null)
                throw new error.TypeMismatchError($"{this.Symbol} function: The second parameter didn't evaluate to a function");

            var lst = (FsList)par0;

            for (int i = 0; i < lst.Length; i++)
            {
                var result = func.Evaluate(parent, new DoListFuncPar { X = lst[i], I = i });

                if (result is bool && (bool)result)
                    return true;
            }

            return false;
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
