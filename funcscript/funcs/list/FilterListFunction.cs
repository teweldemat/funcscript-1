using funcscript.core;
using funcscript.model;
using System.Collections.Generic;

namespace funcscript.funcs.list
{
    public class FilterListFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Dual;

        public string Symbol => "Filter";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.TypeMismatchError($"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent,0);
            var par1 = pars.GetParameter(parent,1);


            return EvaluateInternal(parent, par0, par1);
        }

        private object EvaluateInternal(IFsDataProvider parent, object par0, object par1)
        {
            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: The first parameter should be {this.ParName(0)}");

            if (!(par1 is IFsFunction))
                throw new error.TypeMismatchError($"{this.Symbol} function: The second parameter should be {this.ParName(1)}");

            var func = (IFsFunction)par1;
            var lst = (FsList)par0;
            var res = new List<object>();

            for (int i = 0; i < lst.Length; i++)
            {
                var val = func.Evaluate(parent, new ArrayParameterList(new object[] { lst[i], i }));
                if (val is bool && (bool)val)
                {
                    res.Add(lst[i]);
                }
            }

            return new ArrayFsList(res);
        }


        public string ParName(int index)
        {
            return index switch
            {
                0 => "List",
                1 => "Filter Function",
                _ => "",
            };
        }
    }
}
