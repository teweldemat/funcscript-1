namespace Walya.Core
{
    public partial class WalyaParser
    {
        static bool IsIdentfierFirstChar(char ch)
        {
            return char.IsLetter(ch) || ch == '_';
        }
    }
}
