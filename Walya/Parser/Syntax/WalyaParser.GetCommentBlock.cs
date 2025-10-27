namespace Walya.Core
{
    public partial class WalyaParser
    {
        static int GetCommentBlock(String exp, int index, out ParseNode parseNode)
        {
            parseNode = null;
            var i = GetLiteralMatch(exp, index, "//");
            if (i == index)
                return index;
            var i2 = exp.IndexOf("\n", i);
            if (i2 == -1)
                i = exp.Length;
            else
                i = i2 + 1;
            parseNode = new ParseNode(ParseNodeType.Comment, index, i - index);
            return i;
        }
    }
}
