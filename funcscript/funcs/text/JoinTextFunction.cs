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
            if (c < 1 || (list = pars.GetParameter(parent, 0) as FsList) == null)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: list expected");
            String? separator;
            if (c < 2 || (separator = pars.GetParameter(parent, 1) as String) == null)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: separator expected");

            for (int i = 0; i < list.Data.Length; i++)
            {
                var o = list.Data[i];
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
