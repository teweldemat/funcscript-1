using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace funcscript.funcs.html
{
    internal class HtmlEncodeFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Infix;

        public string Symbol => "HEncode";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var str = pars[0];
            return str == null ? null : System.Web.HttpUtility.HtmlEncode(str);
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:return "text";
                default:
                    return "";
            }
        }
    }
}
