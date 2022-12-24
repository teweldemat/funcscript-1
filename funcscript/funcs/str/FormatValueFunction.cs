using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
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
    public class SubStringFunction : IFsFunction
    {
        public int MaxParsCount => 3;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "substring";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var c = pars.Count;
            if (c == 0)
                return "";
            var str = pars[0] as string;
            if (str == null)
                return null;
            
            int index = 0;
            var par1 = pars[1];
            if (par1 is int)
                index = (int)par1;
            
            int count= 0;
            var par2 = pars[2];
            if (par2 is int)
                count= (int)par2;
            if (index >= str.Length)
                return "";
            if (index + count < str.Length)
                return str.Substring(index, count);
            return str.Substring(index);
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:return "string";
                case 1: return "index";
                case 2: return "count";
                default:
                    return "";
            }
        }
    }
}
