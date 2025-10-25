using funcscript.core;
using System;
using funcscript.model;

namespace funcscript.funcs.logic
{
    public class EvaluateIfNotNull : IFsFunction
    {
        public int MaxParsCount => 2; // Set to 2 for consistent parameter handling

        public CallType CallType => CallType.Infix;

        public string Symbol => "?!";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new error.TypeMismatchError($"{Symbol} function expects exactly two parameters.");

            var val = pars.GetParameter(parent, 0);

            if (val == null)
                return null;

            var val2 = pars.GetParameter(parent, 1);
            return val2;
        }

        public string ParName(int index)
        {
            switch (index)
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
