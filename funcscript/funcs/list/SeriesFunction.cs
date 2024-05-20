using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.list
{
    public class SeriesFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Series";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var parBuilder = new CallRefBuilder(this, parent, pars);

            var par0 = parBuilder.GetParameter( 0);

            if (par0 is ValueReferenceDelegate)
                return parBuilder.CreateRef();
            if (!(par0 is int))
                throw new error.TypeMismatchError($"{this.Symbol}: {ParName(0)} must be an integer");

            int start = (int)par0;

            var par1 = parBuilder.GetParameter(1);
            if (par1 is ValueReferenceDelegate)
                return parBuilder.CreateRef();

            if (!(par1 is int))
                throw new error.TypeMismatchError($"{this.Symbol}: {ParName(1)} must be an integer");

            int count = (int)par1;

            var ret = new List<int>();

            for (int i = 0; i < count; i++)
            {
                ret.Add(start + i);
            }

            return new ArrayFsList(ret);
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0: return "start";
                case 1: return "count";
                default: return "";
            }
        }
    }
}
