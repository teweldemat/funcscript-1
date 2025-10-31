using FuncScript.Core;
using FuncScript.Model;

namespace FuncScript.Functions.Misc
{
    public class ErrorFunction : IFsFunction
    {
        public const string SYMBOL = "error";

        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => SYMBOL;

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count < 1 || pars.Count > MaxParsCount)
                throw new Error.TypeMismatchError($"{this.Symbol}: message and optional type expected");

            var messageValue = pars.GetParameter(parent, 0);
            if (messageValue is not string message)
                throw new Error.TypeMismatchError($"{this.Symbol}: message must be a string");

            string type = null;
            if (pars.Count > 1)
            {
                var typeValue = pars.GetParameter(parent, 1);
                if (typeValue == null)
                    type = null;
                else if (typeValue is string typeString)
                    type = typeString;
                else
                    throw new Error.TypeMismatchError($"{this.Symbol}: optional type must be a string");
            }

            if (string.IsNullOrEmpty(type))
                return new FsError(message);

            return new FsError(type, message);
        }

        public string ParName(int index)
        {
            return index switch
            {
                0 => "Message",
                1 => "ErrorType",
                _ => ""
            };
        }
    }
}
