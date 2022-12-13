using funcscript.core;

namespace funcscript.funcs.logic
{
    public class GreaterThanOrEqualFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => ">=";

        public int Precidence => 200;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");
            var par0 = pars[0];
            var par1 = pars[1];

            if (par0 == null || par1 == null)
                return null;

            if (FuncScript.IsNumeric(par0) && FuncScript.IsNumeric(par1))
            {
                FuncScript.ConvertToCommonNumbericType(par0, par1, out par0, out par1);
            }


            if (par0.GetType() != par1.GetType())
                throw new error.TypeMismatchError($"Fun {this.Symbol} can't compare incomaptiable types.");

            if (par0 is IComparable)
                return ((IComparable)par0).CompareTo(par1) >= 0;

            throw new error.TypeMismatchError($"Fun {this.Symbol} can't compare this data types.{par0.GetType()}");

        }

        public string ParName(int index)
        {
            switch (index)
            {
                case 0:
                    return "Left Value";
                case 1:
                    return "Right Value";
                default:
                    return "";
            }
        }
    }

}
