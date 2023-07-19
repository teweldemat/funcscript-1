using funcscript.core;
using funcscript.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.logic
{

    public class InFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => "in";

        public int Precidence => 150;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");
            var par0 = pars[0];
            var par1 = pars[1];
            if (par1 == null)
                return null;

            if (!(par1 is FsList))
                throw new error.EvaluationTimeException($"{this.Symbol} function: {this.ParName(1)} should be a list");

            var par0Numeric = FuncScript.IsNumeric(par0);
            foreach (var val in ((FsList)par1).Data)
            {
                object left, right;
                if (val == null)
                    continue;
                if (par0Numeric && FuncScript.IsNumeric(val))
                {
                    FuncScript.ConvertToCommonNumbericType(par0, val, out left, out right);
                }
                else
                {
                    left = par0;
                    right = val;
                }
                if (left == null && right == null)
                    return true;
                if (left == null || right == null)
                    return false;
                if (left.GetType() != right.GetType())
                    continue;
                if (left.Equals(right))
                return true;
            }
            return false;
        }

        public string ParName(int index)
        {
            switch (index)
            {
                case 0:
                    return "Value";
                case 1:
                    return "List";
                default:
                    return "";
            }
        }
    }
}
