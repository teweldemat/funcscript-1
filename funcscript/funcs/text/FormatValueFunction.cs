using funcscript.core;
using System;
using System.Text;
using funcscript.model;

namespace funcscript.funcs.text
{
    public class FormatValueFunction : IFsFunction
    {
        public int MaxParsCount => 2;
        public CallType CallType => CallType.Prefix;
        public string Symbol => "format";
        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count < 1)
                throw new error.EvaluationTimeException($"{this.Symbol} requires at least one parameter.");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.Count > 1 ? pars.GetParameter(parent, 1) : null;

            string format = par1 as string;
            var sb = new StringBuilder();
            FuncScript.Format(sb, par0, format);
            return sb.ToString();
        }

        public string ParName(int index)
        {
            return index == 0 ? "value" : "format";
        }
    }
}
