using funcscript.core;
using System;
using System.IO;
using funcscript.model;

namespace funcscript.funcs.os
{
    internal class FileExistsFunction : IFsFunction, IFsDref
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "fileexists";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected, got {pars.Count}");

            var parBuilder = new CallRefBuilder(this, parent, pars);
            var par0 = parBuilder.GetParameter(0);

            if (par0 is ValueReferenceDelegate)
                return parBuilder.CreateRef();

            if (par0 == null || !(par0 is string))
                throw new error.TypeMismatchError($"Function {this.Symbol}. Invalid parameter type, expected a string");

            var filePath = (string)par0;
            return File.Exists(filePath);
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var par0 = FuncScript.Dref(pars.GetParameter(null, 0), false);

            if (par0 == null || !(par0 is string))
                return new FsError( FsError.ERROR_TYPE_MISMATCH,$"Function {this.Symbol}. Invalid parameter type, expected a string");

            var filePath = (string)par0;
            return File.Exists(filePath);
        }

        public string ParName(int index)
        {
            return index == 0 ? "file path" : null;
        }
    }
}