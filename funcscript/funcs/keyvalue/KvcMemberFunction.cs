using funcscript.core;
using funcscript.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.XPath;

namespace funcscript.funcs.keyvalue
{

    public class KvcMemberFunction : IFsFunction,IFsDref
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => ".";

        public int Precidence => 200;

        private object EvaluateInternal(object par0, object par1)
        {
            if (!(par1 is string))
                throw new error.TypeMismatchError($"{Symbol} function: The second parameter should be {ParName(1)}");

            if (par0 == null)
                throw new error.TypeMismatchError($"{Symbol} function: Can't get member {par1} from null data");

            if (!(par0 is KeyValueCollection))
                throw new error.TypeMismatchError($"{Symbol} function: Can't get member {par1} from a {FuncScript.GetFsDataType(par0)}");

            return ((KeyValueCollection)par0).GetData(((string)par1).ToLower());

        }
        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new error.TypeMismatchError($"{Symbol} function: Invalid parameter count. Expected {MaxParsCount}, but got {pars.Count}");

            var parBuilder = new CallRefBuilder(this,parent, pars);
            
            var par1 = parBuilder.GetParameter(1);
            var par0 = parBuilder.GetParameter(0);
            
            if (par0 is ValueReferenceDelegate || par1 is ValueReferenceDelegate)
            {
                return parBuilder.CreateRef();
            }

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

        public object DrefEvaluate(IParameterList pars)
        {
            var member = FuncScript.Dref(pars.GetParameter(null, 1));
            var kvc = FuncScript.Dref(pars.GetParameter(null, 0));
            var ret= EvaluateInternal(kvc,member);
            //return FuncScript.Dref(ret);
            return ret;
        }
    }
}
