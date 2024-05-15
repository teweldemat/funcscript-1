using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.list
{
    public class FindFirstFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "First";

        public int Precidence => 0;
        class ParList : IParameterList
        {
            public object X;
            public object I;

            public override int Count => 2;

            public override (object,CodeLocation) GetParameterWithLocation(IFsDataProvider provider, int index)
            {
                return index switch
                {
                    0 => (X,null),
                    1 => (I,null),
                    _ => (null,null),
                };
            }
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.GetParameter(parent, 1);

            if (par0 == null)
                return null;

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
                var result = func.Evaluate(parent, new ParList { X = lst[i], I = i });

                if (result is bool && (bool)result)
                    return lst[i];
            }

            return null;
        }

        public string ParName(int index)
        {
            switch (index)
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
