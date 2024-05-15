using funcscript.core;
using System;
using funcscript.model;

namespace funcscript.funcs.logic
{
    public class ReplaceIfNull : IFsFunction, IFsDref
    {
        public int MaxParsCount => 2; // Updated to 2 as it seems to be the logical number of parameters expected for this function based on its behavior.

        public CallType CallType => CallType.Infix;

        public string Symbol => "??";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new error.TypeMismatchError($"{Symbol} function expects exactly two parameters.");

            var parBuilder = new CallRefBuilder(this,parent, pars);
            var val = parBuilder.GetParameter(0);
            if (val is ValueReferenceDelegate)
                return parBuilder.CreateRef(); // Defer if the first parameter is a reference.

            if (val != null)
                return val;

            var val2 = parBuilder.GetParameter(1);
            return val2 is ValueReferenceDelegate ? parBuilder.CreateRef() : val2; // Defer if the second parameter is a reference when the first is null.
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var val = FuncScript.Dref(pars.GetParameter(null, 0),false);
            if (val != null)
                return val;

            var val2 = FuncScript.Dref(pars.GetParameter(null, 1),false);
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