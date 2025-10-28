using FunscScript.Core;

namespace FunscScript.Functions.Date
{
    public class TicksToDateFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "TicksToDate";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count > this.MaxParsCount)
                throw new Error.EvaluationTimeException($"{this.Symbol} function: Invalid parameter count. Expected a maximum of {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);

            if (par0 == null)
                return null;

            if (!(par0 is long))
                throw new Error.TypeMismatchError($"Function {this.Symbol}: Type mismatch. Expected a long.");

            var ticks = (long)par0;

            return new DateTime(ticks);
        }


        public string ParName(int index)
        {
            switch (index)
            {
                case 0:
                    return "Ticks";
                default:
                    return "";
            }
        }
    }
}
