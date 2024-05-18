using funcscript.core;
using funcscript.model;
using System.Collections.Generic;
using System.Linq;

namespace funcscript.funcs.list
{
    public class SortListFunction : IFsFunction, IFsDref
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Dual;

        public string Symbol => "Sort";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.TypeMismatchError($"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var parBuilder = new CallRefBuilder(this,parent, pars);
            var par0 = parBuilder.GetParameter(0);
            var par1 = parBuilder.GetParameter(1);

            if (par0 is ValueReferenceDelegate || par1 is ValueReferenceDelegate)
                return parBuilder.CreateRef();

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
            var res = new List<object>(lst);

            res.Sort((x, y) =>
            {
                var sortParamList = new ArrayParameterList(new object[] { x, y });
                var result = func.Evaluate(parent, sortParamList);

                if (!(result is int))
                    throw new error.EvaluationTimeException($"{this.Symbol} function: The sorting function must return an integer");

                return (int)result;
            });

            return new ArrayFsList(res);
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var par0 = FuncScript.Dref(pars.GetParameter(null, 0));
            var par1 = FuncScript.Dref(pars.GetParameter(null, 1));
            return EvaluateInternal(null, par0, par1); // Passing `null` for IFsDataProvider since no parent is specified in DrefEvaluate context.
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
