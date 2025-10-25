using funcscript.core;
using funcscript.model;
using System;

namespace funcscript.funcs.keyvalue
{
    public class KvcNoneNullMemberFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => "?.";

        public int Precidence => 200;

        private object EvaluateInternal(object target, object key)
        {
            if (!(key is string))
                throw new error.TypeMismatchError($"{Symbol} function: The second parameter should be a string (Member key).");

            if (target == null)
                return null;

            if (!(target is KeyValueCollection))
                throw new error.TypeMismatchError($"{Symbol} function: Cannot access member '{key}' on non-KeyValueCollection type '{FuncScript.GetFsDataType(target)}'.");

            return ((KeyValueCollection)target).Get(((string)key).ToLower());
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new error.TypeMismatchError($"{Symbol} function: Expected {MaxParsCount} parameters, received {pars.Count}.");

            
            var key = pars.GetParameter(parent,1);
            var target = pars.GetParameter(parent,0);
            

            return EvaluateInternal(target, key);
        }

        public string ParName(int index)
        {
            return index switch
            {
                0 => "Key-value collection",
                1 => "Member key",
                _ => string.Empty,
            };
        }

    }
}
