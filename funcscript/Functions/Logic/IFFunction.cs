using FuncScript.Core;
using System;
using FuncScript.Model;

namespace FuncScript.Functions.Logic
{
    public class IfConditionFunction : IFsFunction
    {
        public int MaxParsCount => 3;

        public CallType CallType => CallType.Infix;

        public string Symbol => "If";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count < MaxParsCount)
                throw new Error.TypeMismatchError("IfConditionFunction requires three parameters: condition, trueResult, and falseResult.");

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
