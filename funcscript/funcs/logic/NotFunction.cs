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
                throw new error.EvaluationTimeException(
                    $"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);

            if (par0 == null)
                return null;

            if (par0 is bool)
                return !(bool)par0;

            throw new error.TypeMismatchError(
                $"Function {this.Symbol} can't compare these data types: {par0.GetType()}");
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
