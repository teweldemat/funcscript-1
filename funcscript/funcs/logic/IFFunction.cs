using funcscript.core;
using System;

namespace funcscript.funcs.logic
{

    public class IfConditionFunction : IFsFunction
    {
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var cond = pars.GetParameter(parent, 0);

            if (!(cond is bool))
            {
                throw new error.TypeMismatchError("The first parameter must be a boolean value");
            }

            if ((bool)cond)
            {
                return pars.GetParameter(parent, 1);
            }

            return pars.GetParameter(parent, 2);
        }


        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "Condition";
                case 1:
                    return "True Case";
                case 2:
                    return "False Case";
                default:
                    return "";
            }
        }

        

        public int MaxParsCount => 3;

        public CallType CallType => CallType.Infix;

        public string Symbol => "If";

        public int Precidence => 0;
    }
}

