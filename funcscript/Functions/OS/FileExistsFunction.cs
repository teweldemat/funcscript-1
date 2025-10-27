using FuncScript.Core;
using System;
using System.IO;
using FuncScript.Model;

namespace FuncScript.Functions.OS
{
    internal class FileExistsFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "fileexists";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new Error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected, got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);

            if (par0 == null || !(par0 is string))
                throw new Error.TypeMismatchError($"Function {this.Symbol}. Invalid parameter type, expected a string");

            var filePath = (string)par0;
            return File.Exists(filePath);
        }

        public string ParName(int index)
        {
            return index == 0 ? "file path" : null;
        }
    }
}
