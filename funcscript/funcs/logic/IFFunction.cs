using funcscript.core;
using System;
using funcscript.model;

namespace funcscript.funcs.logic
{
    public class IfConditionFunction : IFsFunction
    {
        public int MaxParsCount => 3;

        public CallType CallType => CallType.Infix;

        public string Symbol => "If";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count < MaxParsCount)
                throw new error.TypeMismatchError("IfConditionFunction requires three parameters: condition, trueResult, and falseResult.");

            var condition = pars.GetParameter(parent, 0);

            if (!(condition is bool))
                return new FsError(FsError.ERROR_TYPE_MISMATCH, $"{this.Symbol}: The first parameter must be a boolean value.");

            bool evalCondition = (bool)condition;
            int resultIndex = evalCondition ? 1 : 2;
            var result = pars.GetParameter(parent, resultIndex);

            return result;
        }

        public string ParName(int index)
        {
            switch (index)
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
    }
}
