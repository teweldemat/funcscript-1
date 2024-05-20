using funcscript.core;
using funcscript.model;
using System.Collections.Generic;
using funcscript.funcs.misc;

namespace funcscript.funcs.list
{
    public class ReverseListFunction : IFsFunction, IFsDref
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Reverse";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.TypeMismatchError($"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var parBuilder = new CallRefBuilder(this, parent, pars);
            var par0 = parBuilder.GetParameter(0);

            if (par0 is ValueReferenceDelegate)
                return parBuilder.CreateRef();
            return EvaluateInternal(par0);
        }

        private object EvaluateInternal(object par0)
        {
            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: The parameter should be {this.ParName(0)}");

            var lst = (FsList)par0;
            var res = new List<object>();

            for (int i = lst.Length - 1; i >= 0; i--)
            {
                res.Add(lst[i]);
            }

            return new ArrayFsList(res);
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var par0 = FuncScript.Dref(pars.GetParameter(null, 0));
            return EvaluateInternal(par0);
        }

        public string ParName(int index)
        {
            if (index == 0)
                return "List";
            return "";
        }
    }
}