using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using funcscript.model;

namespace funcscript.funcs.logic
{

    public class AndFunction : IFsFunction
    {
        public int MaxParsCount => -1;

        public CallType CallType => CallType.Infix;

        public string Symbol => "and";

        public int Precidence => 400;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            int count = pars.Count;

            for (int i = 0; i < count; i++)
            {
                var par = pars.GetParameter(parent, i);

                if (!(par is bool b))
                    return new FsError(FsError.ERROR_TYPE_MISMATCH,
                        $"{this.Symbol} doesn't apply to this type:{(par == null ? "null" : par.GetType())} ");

                if(!b)
                    return false;
            }

            return true;
        }


        public string ParName(int index)
        {
            return $"Value {index + 1}";
        }
    }
}
