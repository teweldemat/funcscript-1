using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.list
{
    public class SortListFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Sort";

        public int Precidence => 0;

        class SortListFuncPar : IParameterList
        {
            public object X;
            public object Y;

            public int Count => 2;

            public object GetParameter(IFsDataProvider provider, int index)
            {
                return index switch
                {
                    0 => X,
                    1 => Y,
                    _ => null,
                };
            }
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException(
                    $"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.GetParameter(parent, 1);

            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError(
                    $"{this.Symbol} function: The first parameter should be {this.ParName(0)}");

            if (!(par1 is IFsFunction))
                throw new error.TypeMismatchError(
                    $"{this.Symbol} function: The second parameter should be {this.ParName(1)}");

            var func = par1 as IFsFunction;

            if (func == null)
                throw new error.TypeMismatchError(
                    $"{this.Symbol} function: The second parameter didn't evaluate to a function");

            var lst = (FsList)par0;
            var res = new List<object>(lst.Data);

            res.Sort((x, y) =>
            {
                var result = func.Evaluate(parent, new SortListFuncPar { X = x, Y = y });

                if (!(result is int))
                    throw new error.EvaluationTimeException(
                        $"{this.Symbol} function: The sorting function must return an integer");

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
                _ => "",
            };
        }
    }
}
