namespace FunscScript.Core
{
    public partial class FunscScriptParser
    {
        static bool IsIdentfierOtherChar(char ch)
        {
            return char.IsLetterOrDigit(ch) || ch == '_';
        }
    }
}
