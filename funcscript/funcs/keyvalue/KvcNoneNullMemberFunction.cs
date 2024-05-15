using funcscript.core;
using funcscript.model;
using System;

namespace funcscript.funcs.keyvalue
{
    public class KvcNoneNullMemberFunction : IFsFunction, IFsDref
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

            return ((KeyValueCollection)target).GetData(((string)key).ToLower());
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new error.TypeMismatchError($"{Symbol} function: Expected {MaxParsCount} parameters, received {pars.Count}.");

            var parBuilder = new CallRefBuilder(this, parent, pars);
            
            var key = parBuilder.GetParameter(1);
            var target = parBuilder.GetParameter(0);
            
            if (target is ValueReferenceDelegate || key is ValueReferenceDelegate)
            {
                return parBuilder.CreateRef();
            }

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

        public object DrefEvaluate(IParameterList pars)
        {
            var member = FuncScript.Dref(pars.GetParameter(null, 1),false);
            var kvc = FuncScript.Dref(pars.GetParameter(null, 0),false);
            var result = EvaluateInternal(kvc, member);
            return result;
        }
    }
}
