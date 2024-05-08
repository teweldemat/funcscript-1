using funcscript.core;
using funcscript.model;

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
                throw new error.EvaluationTimeException(
                    $"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.GetParameter(parent, 1);

            // Check for deferred evaluation
            if (par0 is ValueReferenceDelegate || par1 is ValueReferenceDelegate)
            if (par0 is ValueReferenceDelegate || par1 is ValueReferenceDelegate)
                return FunctionRef.Create(parent, this, pars);

            // Handling null parameters
            if (par0 == null || par1 == null)
                return null;

            // Ensure both parameters are of the same type and are comparable
            if (FuncScript.IsNumeric(par0) && FuncScript.IsNumeric(par1))
            {
                FuncScript.ConvertToCommonNumericType(par0, par1, out par0, out par1);
            }

            if (par0.GetType() != par1.GetType())
                throw new error.TypeMismatchError(
                    $"{this.Symbol} function can't compare incompatible types.");

            // Compare using IComparable interface
            if (par0 is IComparable comparable)
                return comparable.CompareTo(par1) >= 0;

            throw new error.TypeMismatchError(
                $"{this.Symbol} function can't compare these data types: {par0.GetType()}");
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
