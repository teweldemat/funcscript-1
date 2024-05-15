using funcscript.core;
using System;
using funcscript.model;

namespace funcscript.funcs.logic
{
    public class IFNullFunction : IFsFunction, IFsDref
    {
        public int MaxParsCount => 2; // Set to 2 for consistent parameter handling

        public CallType CallType => CallType.Infix;

        public string Symbol => "?!";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new error.TypeMismatchError($"{Symbol} function expects exactly two parameters.");

            var parBuilder = new CallRefBuilder(this, parent, pars);
            var val = parBuilder.GetParameter(0);
            if (val is ValueReferenceDelegate)
                return parBuilder.CreateRef(); // Defer if the first parameter is a reference.

            if (val != null)
                return val;

            var val2 = parBuilder.GetParameter(1);
            return val2 is ValueReferenceDelegate ? parBuilder.CreateRef() : val2; // Return the second parameter if the first is null, defer if necessary.
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var val = FuncScript.Dref(pars.GetParameter(null, 0), false);
            if (val != null)
                return FuncScript.Dref(pars.GetParameter(null, 1), false);;
            return null;
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