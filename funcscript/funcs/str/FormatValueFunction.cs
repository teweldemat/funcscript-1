using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.str
{
    public class FormatValueFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "format";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var c = pars.Count;
            if (c== 0)
                return "";
            var par0=pars[0];
            var format = pars[1] as string;
            var sb = new StringBuilder();
            FuncScript.Format(sb,par0, format);
            return sb.ToString();
        }

        public string ParName(int index)
        {
            throw new NotImplementedException();
        }
    }
}
