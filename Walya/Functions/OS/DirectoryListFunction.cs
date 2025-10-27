using Walya.Core;
using Walya.Model;
using System;
using System.Collections.Generic;
using System.IO;

namespace Walya.Functions.OS
{
    internal class DirectoryListFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "dirlist";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new Error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected, got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);
            if (par0 == null || !(par0 is string))
                throw new Error.TypeMismatchError($"Function {this.Symbol}. Invalid parameter type, expected a string");

            var directoryPath = (string)par0;

            if (!Directory.Exists(directoryPath))
                throw new Error.TypeMismatchError($"Function {this.Symbol}. Directory '{directoryPath}' does not exist");
            try
            {
                var files = Directory.GetDirectories(directoryPath).Concat(Directory.GetFiles(directoryPath)).ToArray();
                return new ArrayFsList(files);
            }
            catch (Exception ex)
            {
                throw new Error.EvaluationTimeException($"Function {this.Symbol}. Error retrieving files from '{directoryPath}': {ex.Message}");
            }
        }

        public string ParName(int index)
        {
            return index == 0 ? "directory path" : null;
        }
    }
}
