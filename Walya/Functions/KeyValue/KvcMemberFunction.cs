using Walya.Core;
using Walya.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.XPath;

namespace Walya.Functions.KeyValue
{

    public class KvcMemberFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => ".";

        public int Precedence => 200;

        private object EvaluateInternal(object par0, object par1)
        {
            if (!(par1 is string))
                throw new Error.TypeMismatchError($"{Symbol} function: The second parameter should be {ParName(1)}");

            if (par0 == null)
                throw new Error.TypeMismatchError($"{Symbol} function: Can't get member {par1} from null data");

            if (!(par0 is KeyValueCollection))
                throw new Error.TypeMismatchError($"{Symbol} function: Can't get member {par1} from a {Engine.GetFsDataType(par0)}");

            return ((KeyValueCollection)par0).Get(((string)par1).ToLower());

        }
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new Error.TypeMismatchError($"{Symbol} function: Invalid parameter count. Expected {MaxParsCount}, but got {pars.Count}");

            
            var par1 =pars.GetParameter(parent,1);
            var par0 = pars.GetParameter(parent,0);
            

            return EvaluateInternal(par0, par1);
        }


        public string ParName(int index)
        {
            switch (index)
            {
                case 0:
                    return "Key-value collection";
                case 1:
                    return "Member key";
                default:
                    return "";
            }
        }

        
    }
}
