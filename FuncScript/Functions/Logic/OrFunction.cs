using FuncScript.Core;
using FuncScript.Model;

namespace FuncScript.Functions.Logic
{
    public class OrFunction : IFsFunction
    {
        public int MaxParsCount => -1;

        public CallType CallType => CallType.Infix;

        public string Symbol => "or";

        public int Precedence => 400;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            for (int i = 0; i < pars.Count; i++)
            {
                var par = pars.GetParameter(parent, i);

                if (!(par is bool b))
                    return new FsError(FsError.ERROR_TYPE_MISMATCH,
                        $"{this.Symbol} doesn't apply to this type:{(par == null ? "null" : par.GetType().ToString())}");

                if (b)
                    return true;
            }

            return false;
        }

        public string ParName(int index)
        {
            return $"Value {index + 1}";
        }
    }
}
