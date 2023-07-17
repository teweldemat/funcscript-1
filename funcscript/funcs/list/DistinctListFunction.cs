using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.list
{
    public class DistinctListFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Distinct";

        public int Precidence => 0;

        class DistinctListFuncPar : IParameterList
        {
            public object X;
            public object this[int index]
            {
                get
                {
                    switch (index)
                    {
                        case 0: return X;
                    }
                    return null;
                }
            }

            public int Count => 1;
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");

            var par0 = pars[0];

            if (par0 == null)
                return null;
            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: parameter should be {this.ParName(0)}");

            var lst = (FsList)par0;

            var distinctValues = new HashSet<object>();
            var res = new List<object>();
            for (int i = 0; i < lst.Data.Length; i++)
            {
                if (distinctValues.Add(lst.Data[i]))
                {
                    res.Add(lst.Data[i]);
                }
            }

            return new FsList(res);
        }

        public string ParName(int index)
        {
            if (index == 0)
                return "List";
            return "";
        }
    }
}
