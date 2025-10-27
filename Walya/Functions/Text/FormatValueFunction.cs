using Walya.Core;
using System;
using System.Text;
using Walya.Model;

namespace Walya.Functions.Text
{
    public class FormatValueFunction : IFsFunction
    {
        public int MaxParsCount => 2;
        public CallType CallType => CallType.Prefix;
        public string Symbol => "format";
        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count < 1)
                throw new Error.EvaluationTimeException($"{this.Symbol} requires at least one parameter.");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.Count > 1 ? pars.GetParameter(parent, 1) : null;

            string format = par1 as string;
            var sb = new StringBuilder();
            Engine.Format(sb, par0, format);
            return sb.ToString();
        }

        public string ParName(int index)
        {
            return index == 0 ? "value" : "format";
        }
    }
}
