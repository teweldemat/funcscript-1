using funcscript.core;

namespace funcscript.funcs.math
{
    public class SineFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Sin";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var val=pars[0];
            if(val is int)
            {
                return Math.Sin((double)(int)val);
            }
            if (val is double)
            {
                return Math.Sin((double)val);
            }
            if (val is long)
            {
                return Math.Sin((long)val);
            }
            throw new error.TypeMismatchError($"{this.Symbol}: number expected");
        }

        public string ParName(int index)
        {
            return "number";
        }
    }

    public class CosineFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Cos";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var val = pars[0];
            if (val is int)
            {
                return Math.Cos((double)(int)val);
            }
            if (val is double)
            {
                return Math.Cos((double)val);
            }
            if (val is long)
            {
                return Math.Cos((long)val);
            }
            throw new error.TypeMismatchError($"{this.Symbol}: number expected");
        }

        public string ParName(int index)
        {
            return "number";
        }
    }
}
