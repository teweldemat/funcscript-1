using FuncScript.Core;
using FuncScript.Model;
using System.Collections.Generic;
using System.Linq;

namespace FuncScript.Functions.List
{
    public class SortListFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Dual;

        public string Symbol => "Sort";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new Error.TypeMismatchError($"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent,0);
            var par1 = pars.GetParameter(parent,1);

            return EvaluateInternal(parent, par0, par1);
        }

        private object EvaluateInternal(IFsDataProvider parent, object par0, object par1)
        {
            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new Error.TypeMismatchError($"{this.Symbol} function: The first parameter should be {this.ParName(0)}");

            if (!(par1 is IFsFunction))
                throw new Error.TypeMismatchError($"{this.Symbol} function: The second parameter should be {this.ParName(1)}");

            var func = (IFsFunction)par1;
            var lst = (FsList)par0;
            var res = new List<object>(lst);

            res.Sort((x, y) =>
            {
                var sortParamList = new ArrayParameterList(new object[] { x, y });
                var result = func.Evaluate(parent, sortParamList);

                if (!(result is int))
                    throw new Error.EvaluationTimeException($"{this.Symbol} function: The sorting function must return an integer");

                return (int)result;
            });

            return new ArrayFsList(res);
        }


        public string ParName(int index)
        {
            return index switch
            {
                0 => "List",
                1 => "Sorting Function",
                _ => ""
            };
        }
    }
}
