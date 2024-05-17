using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.text
{
    public class FindTextFunction : IFsFunction, IFsDref
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

            var parBuilder = new CallRefBuilder(this, parent, pars);
            var par0 = parBuilder.GetParameter(0);
            var par1 = parBuilder.GetParameter(1);
            var par2 = parBuilder.GetParameter(2);

            if (par0 is ValueReferenceDelegate || par1 is ValueReferenceDelegate || par2 is ValueReferenceDelegate)
                return parBuilder.CreateRef();

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

        public object DrefEvaluate(IParameterList pars)
        {
            var text = FuncScript.Dref(pars.GetParameter(null, 0), false) as string;
            var search = FuncScript.Dref(pars.GetParameter(null, 1), false) as string;
            var startIndexObj = FuncScript.Dref(pars.GetParameter(null, 2), false);
            int startIndex = startIndexObj != null ? (int)startIndexObj : 0;

            if (text == null || search == null)
                throw new funcscript.error.TypeMismatchError($"{Symbol}: Two strings and optionally an index expected as parameters");

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
