using funcscript.core;
using System;
using System.Globalization;
using funcscript.model;

namespace funcscript.funcs.text
{
    public class ParseText : IFsFunction, IFsDref,IFsDataProvider
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "parse";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count == 0)
                throw new error.TypeMismatchError($"{this.Symbol} requires at least one parameter");
            
            var parBuilder = new CallRefBuilder(this, parent, pars);
            var par0 = parBuilder.GetParameter(0);
            if (par0 is ValueReferenceDelegate)
                return parBuilder.CreateRef();
            
            if (par0 == null)
                return null;
            
            var str = par0.ToString();
            object par1;
            string format = null;
            if (pars.Count > 1)
            {
                par1 = parBuilder.GetParameter(1);
                if (par1 is ValueReferenceDelegate)
                    return parBuilder.CreateRef();
                format = par1?.ToString();
            }

            return ParseAccordingToFormat(str, format);
        }

        private object ParseAccordingToFormat(string str, string format)
        {
            if (string.IsNullOrEmpty(format))
                return str;
            if (str == null)
                return null;
            switch (format.ToLower())
            {
                case "hex":
                    if (str.StartsWith("0x"))
                        return Convert.ToInt32(str, 16);
                    return Convert.ToInt32("0x" + str, 16);
                case "l":
                    return Convert.ToInt64(str);
                case "fs":
                    return FuncScript.Evaluate(this, str); // Assuming parent context is not needed or it is correctly handled within FuncScript.Evaluate
                default:
                    return str;
            }
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var par0 = FuncScript.Dref(pars.GetParameter(null, 0));
            var par1 = pars.Count > 1 ? FuncScript.Dref(pars.GetParameter(null, 1)) : null;
            var str = par0?.ToString();
            var format = par1?.ToString();
            return ParseAccordingToFormat(str, format);
        }

        public string ParName(int index)
        {
            return index switch
            {
                0 => "text",
                1 => "format",
                _ => null
            };
        }

        public object GetData(string name)
        {
            return new FsError(FsError.ERROR_TYPE_INVALID_PARAMETER, $"The parsed function script should have no variables");
        }

        public IFsDataProvider ParentProvider { get; }
        public bool IsDefined(string key)
        {
            throw new NotImplementedException();
        }
    }
}
