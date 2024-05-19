using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.logic
{
    public class OrFunction : IFsFunction, IFsDref
    {
        public int MaxParsCount => -1;

        public CallType CallType => CallType.Infix;

        public string Symbol => "or";

        public int Precidence => 400;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var parBuilder = new CallRefBuilder(this, parent, pars);

            for (int i = 0; i < pars.Count; i++)
            {
                var par = parBuilder.GetParameter(i);

                if (par is ValueReferenceDelegate)
                    return parBuilder.CreateRef();

                if (!(par is bool b))
                    return new FsError(FsError.ERROR_TYPE_MISMATCH,
                        $"{this.Symbol} doesn't apply to this type:{(par == null ? "null" : par.GetType().ToString())}");

                if (b)
                    return true;
            }

            return false;
        }

        public object DrefEvaluate(IParameterList pars)
        {
            for (int i = 0; i < MaxParsCount; i++)
            {
                var par = FuncScript.Dref(pars.GetParameter(null, i), false);

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