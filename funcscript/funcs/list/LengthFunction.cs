using funcscript.core;
using funcscript.model;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.list
{
    public class LengthFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Len";

        public int Precidence => 0;
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");
            var par0 = pars[0];
            if (par0 == null)
                return 0;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: first paramter should be {this.ParName(0)}");
            return ((FsList)par0).Data.Length;
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "List";
                default:
                    return "";
            }
        }
    }
}
