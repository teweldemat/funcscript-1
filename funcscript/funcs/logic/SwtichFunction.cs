using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.logic
{
    public class SwitchFunction : IFsFunction
    {
        public int MaxParsCount => -1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "switch";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var selector = pars[0];
            for (var i = 1; i < pars.Count - 1; i += 2)
            {
                var val = pars[i];
                if((val==null && selector==null ) || (val != null && selector != null && selector.Equals(val)))
                {
                    return pars[i + 1];
                }
            }

            if (pars.Count % 2 == 0)
            {
                return pars[pars.Count - 1];
            }

            return null;
        }

        public string ParName(int index)
        {
            return "Parameter " + (index + 1);
        }
    }
}
