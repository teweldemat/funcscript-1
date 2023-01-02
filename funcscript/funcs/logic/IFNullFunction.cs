using funcscript.core;
using System;

namespace funcscript.funcs.logic
{

    public class IFNullFunction : IFsFunction
    {
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var val = pars[0];

            if (val != null)
            {
                return pars[1];
            }
            return null;
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "Value";
                case 1:
                    return "Not Null Expression";
                default:
                    return "";
            }
        }

        

        public int MaxParsCount => 3;

        public CallType CallType => CallType.Infix;

        public string Symbol => "?!";

        public int Precidence => 0;
    }
}

