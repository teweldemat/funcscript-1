using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.logic
{

    public class AndFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => "and";

        public int Precidence => 400;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            int count = pars.Count;

            for (int i = 0; i < count; i++)
            {
                var par = pars.GetParameter(parent, i);

                if (par == null)
                    return null;

                if (par is bool && !(bool)par)
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
