﻿using FuncScript.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace FuncScript.Functions.Logic
{

    public class GuidFunction : IFsFunction
    {
        public int MaxParsCount => 1;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "guid";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new Error.EvaluationTimeException(
                    $"{this.Symbol} function: Invalid parameter count. Expected {this.MaxParsCount}, but got {pars.Count}");

            var par0 = pars.GetParameter(parent, 0);

            if (par0 == null)
                return null;

            if (!(par0 is string))
                throw new Error.TypeMismatchError(
                    $"Function {this.Symbol}: Type mismatch. Expected a string.");

            var str = (string)par0;

            if (!Guid.TryParse(str, out var guid))
                throw new Error.TypeMismatchError(
                    $"Function {this.Symbol}: String '{par0}' is not a valid GUID.");

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
