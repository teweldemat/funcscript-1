namespace FuncScript.Core
{
    public partial class FuncScriptParser
    {
        static bool isCharWhiteSpace(char ch)
            => ch == ' ' ||
               ch == '\r' ||
               ch == '\t' ||
               ch == '\n';
    }
}
