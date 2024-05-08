using funcscript.core;
using System;
using funcscript.model;

namespace funcscript.funcs.logic
{

    public class IFNotNullFunction : IFsFunction
    {
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var val = pars.GetParameter(parent, 0);
            if (val is ValueReferenceDelegate)
                return  FunctionRef.Create(parent,this, pars);
            
            if (val == null)
            {
                var val2= pars.GetParameter(parent, 1);
                if(val2 is ValueReferenceDelegate)
                    return  FunctionRef.Create(parent,this, pars);
                return val2;
            }

            return val;
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

        

        public int MaxParsCount => 3;

        public CallType CallType => CallType.Infix;

        public string Symbol => "??";

        public int Precidence => 0;
    }
}

