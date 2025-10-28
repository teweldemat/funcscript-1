using FuncScript.Core;
using System;
using FuncScript.Model;

namespace FuncScript.Functions.Logic
{
    public class ReplaceIfNull : IFsFunction
    {
        public int MaxParsCount => 2; // Updated to 2 as it seems to be the logical number of parameters expected for this function based on its behavior.

        public CallType CallType => CallType.Infix;

        public string Symbol => "??";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new Error.TypeMismatchError($"{Symbol} function expects exactly two parameters.");

            var val = pars.GetParameter(parent, 0);

            if (val != null)
                return val;

            var val2 = pars.GetParameter(parent, 1);
            return val2;
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "Value";
                case 1:
                    return "Null Replacement";
                default:
                    return "";
            }
        }
    }
}
