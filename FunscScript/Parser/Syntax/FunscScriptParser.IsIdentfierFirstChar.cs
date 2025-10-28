namespace FunscScript.Core
{
    public partial class FunscScriptParser
    {
        static bool IsIdentfierFirstChar(char ch)
        {
            return char.IsLetter(ch) || ch == '_';
        }
    }
}
