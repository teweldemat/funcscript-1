using funcscript.core;
using System.Runtime.Serialization;

namespace funcscript.funcs.logic
{
    public class DateFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Date";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count > this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. Max of {this.MaxParsCount} expected got {pars.Count}");
            var par0 = pars[0];

            if (par0 == null)
                return null;

            if (!(par0 is string))
                throw new error.TypeMismatchError($"Function {this.Symbol}. Type mistmatch");
            var str = (string)par0;
            var par1 = pars[1] as string;
            DateTime date;
            if (par1 == null)
            {
                if (!DateTime.TryParse(str, out date))
                    throw new error.TypeMismatchError($"Function {this.Symbol}. String '{par0}' can't be converted to date");
            }
            else
            {
                var f = new DateTimeFormat(par1);
                if (!DateTime.TryParse(str,f.FormatProvider,System.Globalization.DateTimeStyles.AssumeUniversal, out date))
                    throw new error.TypeMismatchError($"Function {this.Symbol}. String '{par0}' can't be converted to date");
            }
            return date;
        }

        public string ParName(int index)
        {
            switch (index)
            {
                case 0:
                    return "Date string";
                case 1:
                    return "Date format";
                default:
                    return "";
            }
        }
    }
}
