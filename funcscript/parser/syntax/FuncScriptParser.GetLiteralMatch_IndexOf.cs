namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        // Deprecated: This method uses the IndexOf method which can be slow for large strings or when searching for multiple keywords.
        // It is recommended to use the GetLiteralMatch method instead.
        [Obsolete("Use GetLiteralMatch instead.")]
        static int GetLiteralMatch_IndexOf(String exp, int index, params string[] keyWord)
        {
            foreach (var k in keyWord)
            {
                if (exp.IndexOf(k, index, StringComparison.CurrentCultureIgnoreCase) == index)
                {
                    return index + k.Length;
                }
            }

            return index;
        }
    }
}
