using Walya.Core;
using System;
using Walya.Model;

namespace Walya.Functions.Text
{
    internal class EndsWithFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "endswith";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new Error.TypeMismatchError($"{this.Symbol} function: Invalid parameter count. Expected {MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.GetParameter(parent, 1);

            return EvaluateInternal(par0, par1);
        }

        private object EvaluateInternal(object par0, object par1)
        {
            if (par0 == null || par1 == null)
                return false;

            if (!(par0 is string) || !(par1 is string))
                throw new Error.TypeMismatchError($"Function {this.Symbol}. Both parameters must be strings");

            var mainString = (string)par0;
            var ending = (string)par1;

            return mainString.EndsWith(ending, StringComparison.Ordinal);
        }

        public string ParName(int index)
        {
            return index switch
            {
                0 => "main string",
                1 => "ending substring",
                _ => null
            };
        }
    }
}
