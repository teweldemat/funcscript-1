using Walya.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Walya.Functions.Logic
{
    public class CaseFunction : IFsFunction
    {
        public int MaxParsCount => -1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Case";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            int count = pars.Count;

            for (int i = 0; i < count / 2; i++)
            {
                var cond = pars.GetParameter(parent, 2 * i);

                if (cond is bool && (bool)cond)
                {
                    return pars.GetParameter(parent, 2 * i + 1);
                }
            }

            if (count % 2 == 1)
            {
                return pars.GetParameter(parent, count - 1);
            }

            return null;
        }

        public string ParName(int index)
        {
            return "Parameter " + (index + 1);
        }
    }
}
