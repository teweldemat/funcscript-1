
namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        static int GetKeyWordLiteral(String exp, int index, out object literal, out ParseNode parseNode)
        {
            parseNode = null;
            var i = GetLiteralMatch(exp, index, "null");
            if (i > index)
            {
                literal = null;
            }
            else if ((i = GetLiteralMatch(exp, index, "true")) > index)
            {
                literal = true;
            }
            else if ((i = GetLiteralMatch(exp, index, "false")) > index)
            {
                literal = false;
            }
            else
            {
                literal = null;
                return index;
            }

            parseNode = new ParseNode(ParseNodeType.KeyWord, index, i - index);
            return i;
        }
    }
}
