using funcscript.core;
using funcscript.model;
using System;

namespace funcscript.funcs.list
{
    public class ContainsFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Contains";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.TypeMismatchError($"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var container = pars.GetParameter(parent,0);
            var item = pars.GetParameter(parent,1);


            return EvaluateInternal(container, item);
        }

        private object EvaluateInternal(object container, object item)
        {
            if (container is FsList list)
            {
                return list.Contains(item);
            }

            if (container is string str && item is string substr)
            {
                return str.Contains(substr, StringComparison.OrdinalIgnoreCase);
            }

            throw new error.TypeMismatchError($"{this.Symbol} function: Invalid types for parameters");
        }


        public string ParName(int index)
        {
            return index switch
            {
                0 => "Container (List/String)",
                1 => "Item (Object/String)",
                _ => "",
            };
        }
    }
}
