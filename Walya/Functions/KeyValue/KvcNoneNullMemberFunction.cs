using Walya.Core;
using Walya.Model;
using System;

namespace Walya.Functions.KeyValue
{
    public class KvcNoneNullMemberFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => "?.";

        public int Precedence => 200;

        private object EvaluateInternal(object target, object key)
        {
            if (!(key is string))
                throw new Error.TypeMismatchError($"{Symbol} function: The second parameter should be a string (Member key).");

            if (target == null)
                return null;

            if (!(target is KeyValueCollection))
                throw new Error.TypeMismatchError($"{Symbol} function: Cannot access member '{key}' on non-KeyValueCollection type '{Walya.GetFsDataType(target)}'.");

            return ((KeyValueCollection)target).Get(((string)key).ToLower());
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new Error.TypeMismatchError($"{Symbol} function: Expected {MaxParsCount} parameters, received {pars.Count}.");

            
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
