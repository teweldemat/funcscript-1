using funcscript.core;

namespace funcscript.funcs.logic
{
    public class OrFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => "or";

        public int Precidence => 400;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            int c = pars.Count;
            for (int i = 0; i < c; i++)
            {
                var par = pars[i];
                if (par == null)
                    return null;
                if (par is bool)
                {
                    if ((bool)par)
                        return true;
                }
            }
            return false;
        }

        public string ParName(int index)
        {
            return $"Value {index + 1}";
        }
    }
}
