using FunscScript.Core;
using FunscScript.Model;
using System.Collections.Generic;
using FunscScript.Functions.Misc;

namespace FunscScript.Functions.List
{
    public class ReverseListFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Reverse";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new Error.TypeMismatchError($"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");
            var par0 = pars.GetParameter(parent,0);
            return EvaluateInternal(par0);
        }

        private object EvaluateInternal(object par0)
        {
            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new Error.TypeMismatchError($"{this.Symbol} function: The parameter should be {this.ParName(0)}");

            var lst = (FsList)par0;
            var res = new List<object>();

            for (int i = lst.Length - 1; i >= 0; i--)
            {
                res.Add(lst[i]);
            }

            return new ArrayFsList(res);
        }


        public string ParName(int index)
        {
            if (index == 0)
                return "List";
            return "";
        }
    }
}