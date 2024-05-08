using funcscript.core;
using System;
using funcscript.model;

namespace funcscript.funcs.logic
{

    public class IfConditionFunction : IFsFunction
    {
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count < 3)
            {
                throw new error.TypeMismatchError("IfConditionFunction requires three parameters: condition, trueResult, and falseResult.");
            }

            // First, evaluate or prepare to defer the condition
            var condition = pars.GetParameter(parent, 0);
            if (condition is ValueReferenceDelegate condRef)
            {
                // Defer the entire evaluation if the condition is a reference
                return FunctionRef.Create(parent, this, pars);
            }

            if (!(condition is bool))
            {
                throw new error.TypeMismatchError("The first parameter must be a boolean value.");
            }

            // Evaluate the condition and decide which result parameter to evaluate or defer
            bool evalCondition = (bool)condition;
            int resultIndex = evalCondition ? 1 : 2;

            var result = pars.GetParameter(parent, resultIndex);
            if (result is ValueReferenceDelegate resultRef)
            {
                // Defer the evaluation of the result if it is a reference
                return FunctionRef.Create(parent, this, pars);
            }

            // Return the result directly if it's already a concrete value
            return result;
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

