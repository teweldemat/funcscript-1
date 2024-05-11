using funcscript.core;
using System;
using funcscript.model;

namespace funcscript.funcs.logic
{
    public class IfConditionFunction : IFsFunction, IFsDref
    {
        public int MaxParsCount => 3;

        public CallType CallType => CallType.Infix;

        public string Symbol => "If";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count < MaxParsCount)
                throw new error.TypeMismatchError("IfConditionFunction requires three parameters: condition, trueResult, and falseResult.");

            var parBuilder = new CallRefBuilder(this,parent, pars);
            var condition = parBuilder.GetParameter(0);

            if (condition is ValueReferenceDelegate)
                return parBuilder.CreateRef();

            if (!(condition is bool))
                throw new error.TypeMismatchError("The first parameter must be a boolean value.");

            bool evalCondition = (bool)condition;
            int resultIndex = evalCondition ? 1 : 2;
            var result = parBuilder.GetParameter(resultIndex);

            return result is ValueReferenceDelegate ? parBuilder.CreateRef() : result;
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var condition = FuncScript.Dref(pars.GetParameter(null, 0));
            if (!(condition is bool))
                throw new error.TypeMismatchError("The first parameter must be a boolean value when dereferenced.");

            bool evalCondition = (bool)condition;
            int resultIndex = evalCondition ? 1 : 2;
            var result = FuncScript.Dref(pars.GetParameter(null, resultIndex));

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
