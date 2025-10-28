namespace FunscScript.Core
{
    public partial class FunscScriptParser
    {
        static bool isCharWhiteSpace(char ch)
            => ch == ' ' ||
               ch == '\r' ||
               ch == '\t' ||
               ch == '\n';
    }
}
