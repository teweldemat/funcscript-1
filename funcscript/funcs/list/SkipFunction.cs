using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.list
{
    public class SkipFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Skip";

        public int Precidence => 0;

        class ParList : IParameterList
        {
            public object X;
            public object N;

            public int Count => 2;

            public object GetParameter(IFsDataProvider provider, int index)
            {
                return index switch
                {
                    0 => X,
                    1 => N,
                    _ => null,
                };
            }
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException(
                    $"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.GetParameter(parent, 1);

            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError(
                    $"{this.Symbol} function: The first parameter should be {this.ParName(0)}");

            if (!(par1 is int))
                throw new error.TypeMismatchError(
                    $"{this.Symbol} function: The second parameter should be {this.ParName(1)}");

            var lst = (FsList)par0;
            int n = (int)par1;

            if (n <= 0)
                return lst;

            if (n >= lst.Data.Length)
                return new FsList(new object[] { });

            int newArrayLength = lst.Data.Length - n;
            object[] newArray = new object[newArrayLength];

            Array.Copy(lst.Data, n, newArray, 0, newArrayLength);

            return new FsList(newArray);
        }

        public string ParName(int index)
        {
            switch (index)
            {
                case 0:
                    return "List";
                case 1:
                    return "Number";
                default:
                    return "";
            }
        }
    }
}
