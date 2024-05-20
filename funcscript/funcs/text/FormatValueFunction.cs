using funcscript.core;
using System;
using System.Text;
using funcscript.model;

namespace funcscript.funcs.text
{
    public class FormatValueFunction : IFsFunction, IFsDref
    {
        public int MaxParsCount => 2;
        public CallType CallType => CallType.Prefix;
        public string Symbol => "format";
        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count < 1)
                throw new error.EvaluationTimeException($"{this.Symbol} requires at least one parameter.");

            var parBuilder = new CallRefBuilder(this, parent, pars);
            var par0 = parBuilder.GetParameter(0);
            var par1 = parBuilder.GetParameter(1);

            if (par0 is ValueReferenceDelegate || par1 is ValueReferenceDelegate)
                return parBuilder.CreateRef();

            string format = par1 as string;
            var sb = new StringBuilder();
            FuncScript.Format(sb, par0, format);
            return sb.ToString();
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var par0 = FuncScript.Dref(pars.GetParameter(null, 0));
            var format = FuncScript.Dref(pars.GetParameter(null, 1)) as string;
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
