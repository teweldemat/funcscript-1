using funcscript.core;
using System;
using System.IO;
using funcscript.model;

namespace funcscript.funcs.os
{
    internal class FileExistsFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "fileexists";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected, got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);

            if (par0 == null || !(par0 is string))
                throw new error.TypeMismatchError($"Function {this.Symbol}. Invalid parameter type, expected a string");

            var filePath = (string)par0;
            return File.Exists(filePath);
        }

        public string ParName(int index)
        {
            return index == 0 ? "file path" : null;
        }
    }
}
