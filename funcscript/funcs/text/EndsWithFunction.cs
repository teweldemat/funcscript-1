using funcscript.core;
using System;

namespace funcscript.funcs.strings
{
    internal class EndsWithFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "endswith";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected, got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.GetParameter(parent, 1);

            if (par0 == null || par1 == null)
                return false;

            if (!(par0 is string) || !(par1 is string))
                throw new error.TypeMismatchError($"Function {this.Symbol}. Both parameters must be strings");

            var mainString = (string)par0;
            var ending = (string)par1;

            return mainString.EndsWith(ending, StringComparison.Ordinal);
        }
        public string ParName(int index)
        {
            switch (index)
            {
                case 0:
                    return "main string";
                case 1:
                    return "ending substring";
                default:
                    return null;
            }
        }
    }
}
