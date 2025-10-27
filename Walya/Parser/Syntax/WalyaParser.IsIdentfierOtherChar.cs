namespace Walya.Core
{
    public partial class WalyaParser
    {
        static bool IsIdentfierOtherChar(char ch)
        {
            return char.IsLetterOrDigit(ch) || ch == '_';
        }
    }
}
