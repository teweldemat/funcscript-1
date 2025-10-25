using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.text
{
    public class FindTextFunction : IFsFunction
    {
        public const string SYMBOL = "find";
        public int MaxParsCount => 3;

        public CallType CallType => CallType.Prefix;

        public string Symbol => SYMBOL;

        public int Precidence => 100;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count < 2 || pars.Count > MaxParsCount)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: Two or three parameters expected");

            var par0 = pars.GetParameter(parent, 0);
            var par1 = pars.GetParameter(parent, 1);
            var par2 = pars.Count > 2 ? pars.GetParameter(parent, 2) : null;

            if (par0 == null || par1 == null)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: Two strings and optionally an index expected as parameters");

            if (!(par0 is string text))
                return new FsError(FsError.ERROR_TYPE_MISMATCH, $"{this.Symbol}: first parameter should be string");
            if (!(par1 is string search))
                return new FsError(FsError.ERROR_TYPE_MISMATCH,$"{this.Symbol}: second parameter should be string");
            if (!(par2 is int startIndex))
                startIndex = 0;
            if(startIndex<0||startIndex>=text.Length)
                 return new FsError(FsError.ERROR_TYPE_INVALID_PARAMETER,$"{this.Symbol}: index is out of range");
            return text.IndexOf(search, startIndex);
        }

        public string ParName(int index)
        {
            return index switch
            {
                0 => "Text",
                1 => "Search",
                2 => "StartIndex",
                _ => ""
            };
        }
    }
}
