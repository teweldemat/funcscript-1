using funcscript.core;
using funcscript.model;
using System.Text;

namespace funcscript.funcs.math
{
    public class JoinTextFunction : IFsFunction
    {
        public const string SYMBOL = "join";
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => SYMBOL;

        public int Precidence => 100;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            StringBuilder sb = new StringBuilder();

            int c = pars.Count;
            FsList? list;
            if (c < 2)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: two paramters expected");
            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.GetParameter(parent, 1);
            if (par0 is ValueReferenceDelegate || par1 is ValueReferenceDelegate)
                return CallRef.Create(parent, this, pars);
            if ((list = par0 as FsList) == null)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: list expected");
            
            String? separator;
            if ((separator = par1 as String) == null)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: separator expected");

            for (int i = 0; i < list.Length; i++)
            {
                var o = list[i];
                if (o != null)
                {
                    if (sb.Length > 0)
                        sb.Append(separator);
                    sb.Append(o.ToString());
                }
            }
            return sb.ToString();
        }
        public string ParName(int index)
        {
            switch (index)
            {
                case 0:
                    return "List";
                case 1:
                    return "Separator";
                default:
                    return "";
            }
        }
    }
}
