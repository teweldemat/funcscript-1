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
            public object this[int index]
            {
                get
                {
                    switch (index)
                    {
                        case 0: return X;
                        case 1: return I;
                    }
                    return null;
                }
            }

            public int Count => 2;
        }
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");
            var par0 = pars[0];
            var par1 = pars[1];
            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: first paramter should be {this.ParName(0)}");
            if (!(par1 is IFsFunction))
                throw new error.TypeMismatchError($"{this.Symbol} function: second paramter should be {this.ParName(1)}");
            var func = par1 as IFsFunction;
            if (func == null)
                throw new error.TypeMismatchError($"{this.Symbol} function: second paramter didn't evaluate to a function");
            var lst = (FsList)par0;
            for (int i = 0; i < lst.Data.Length; i++)
            {
                var res = func.Evaluate(parent, new ParList { X = lst.Data[i], I = i });
                if (res is bool)
                    if ((bool)res)
                        return lst.Data[i];
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
