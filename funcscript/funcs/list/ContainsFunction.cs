using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.list
{
    public class ContainsFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Contains";

        public int Precidence => 0;

        class ContainsFuncPar : IParameterList
        {
            public object X;
            public object Y;
            public object this[int index]
            {
                get
                {
                    return index switch
                    {
                        0 => X,
                        1 => Y,
                        _ => null,
                    };
                }
            }

            public int Count => 2;
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");

            var container = pars[0];
            var item = pars[1];

            if (container is FsList list)
            {
                return list.Data.Contains(item);
            }

            if (container is string str)
            {
                if (item is string substr)
                {
                    return str.Contains(substr, StringComparison.OrdinalIgnoreCase);
                }
                else
                {
                    throw new error.TypeMismatchError($"{this.Symbol} function: second parameter should be a string when the first is a string");
                }
            }

            throw new error.TypeMismatchError($"{this.Symbol} function: first parameter should be a list or a string");
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
