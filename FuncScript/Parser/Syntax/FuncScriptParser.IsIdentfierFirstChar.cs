namespace FuncScript.Core
{
    public partial class FuncScriptParser
    {
        static bool IsIdentfierFirstChar(char ch)
        {
            return char.IsLetter(ch) || ch == '_';
        }
    }
}
