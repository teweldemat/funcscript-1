namespace Walya.Core
{
    public partial class WalyaParser
    {
        static bool isCharWhiteSpace(char ch)
            => ch == ' ' ||
               ch == '\r' ||
               ch == '\t' ||
               ch == '\n';
    }
}
