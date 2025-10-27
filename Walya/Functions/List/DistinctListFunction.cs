using Walya.Core;
using Walya.Model;

namespace Walya.Functions.List
{
    public class DistinctListFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Distinct";

        public int Precedence => 0;

        class DistinctListFuncPar : IParameterList
        {
            public object X;

            public override int Count => 1;

            public override object GetParameter(IFsDataProvider provider, int index)
            {
                return index switch
                {
                    0 => X,
                    _ => null
                };
            }
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new Error.EvaluationTimeException($"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);

            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new Error.TypeMismatchError($"{this.Symbol} function: The parameter should be {this.ParName(0)}");

            var lst = (FsList)par0;

            var distinctValues = new HashSet<object>();
            var res = new List<object>();

            for (int i = 0; i < lst.Length; i++)
            {
                if (distinctValues.Add(lst[i]))
                {
                    res.Add(lst[i]);
                }
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
