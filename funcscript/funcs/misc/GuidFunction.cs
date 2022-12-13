using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.logic
{

    public class GuidFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "guid";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");
            var par0=pars[0];

            if (par0 == null)
                return null;
            
            if (!(par0 is string))
                throw new error.TypeMismatchError($"Function {this.Symbol}. Type mistmatch");
            var str = (string)par0;
            if(!Guid.TryParse(str,out var guid))
                throw new error.TypeMismatchError($"Function {this.Symbol}. String '{par0}' not guid");
            return guid;
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "Guid string";
                default:
                    return "";
            }
        }
    }
}
