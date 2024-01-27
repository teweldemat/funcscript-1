using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.logic
{
    public class CaseFunction : IFsFunction
    {
        public int MaxParsCount => -1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Case";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var i = 0;
            for(i = 0; i < pars.Count / 2; i++)
            {
                var cond = pars[2*i];
                if(cond is Boolean && (Boolean)cond)
                {
                    return pars[2 * i + 1];
                }
            }
            if(pars.Count % 2==1)
            {
                return pars[pars.Count-1];
            }
            return null;
        }

        public string ParName(int index)
        {
            return "Parameter " + (index + 1);
        }
    }
}
