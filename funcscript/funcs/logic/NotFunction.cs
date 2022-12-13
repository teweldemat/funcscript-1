using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.logic
{
    
    public class NotFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "not";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");
            var par0=pars[0];

            if (par0 == null)
                return null;

            if (par0 is bool)
                return !(bool)par0;
            
            throw new error.TypeMismatchError($"Fun {this.Symbol} can't compare this data types.{par0.GetType()}");

        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "Boolean";
                default:
                    return "";
            }
        }
    }
}
