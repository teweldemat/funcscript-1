using funcscript.core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.os
{
    internal class FileTextFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "file";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected got {pars.Count}");
            var par0 = pars[0];

            if (par0 == null)
                return null;

            if (!(par0 is string))
                throw new error.TypeMismatchError($"Function {this.Symbol}. Type mistmatch");
            var fileName = (string)par0;
            if (!System.IO.File.Exists(fileName))
                throw new error.TypeMismatchError($"Function {this.Symbol}. File '{par0}' doesn't exist");
            if(new System.IO.FileInfo(fileName).Length>1000000)
                throw new error.TypeMismatchError($"Function {this.Symbol}. File '{par0}' is too big");
            return System.IO.File.ReadAllText(fileName);

        }

        public string ParName(int index)
        {
            switch (index)
            {
                case 0: return "file name";
                default:
                    return null;
            }
        }
    }
}
