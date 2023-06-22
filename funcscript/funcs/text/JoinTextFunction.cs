using funcscript.core;
using funcscript.model;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.math
{
    public class JoinTextFunction : IFsFunction
    {
        public const string SYMBOL = "join";
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => SYMBOL;

        public int Precidence => 100;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            StringBuilder sb = new StringBuilder();

            int c = pars.Count;
            FsList? list;
            if (c < 1 || (list = pars[0] as FsList)==null)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: list expected");
            String? separtor;
            if (c < 2 || (separtor = pars[1] as String) == null)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: separator expected");


            for (int i = 0; i < list.Data.Length; i++)
            {

                var o = list.Data[i];
                if (sb.Length > 0)
                    sb.Append(separtor);
                sb.Append(o==null?"":o.ToString());
            }
            return sb.ToString();
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "List";
                case 1:
                    return "Separator";
                default:
                    return "";
            }
        }
    }
}
