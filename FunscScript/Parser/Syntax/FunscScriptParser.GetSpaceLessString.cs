namespace FunscScript.Core
{
    public partial class FunscScriptParser
    {
        static int GetSpaceLessString(String exp, int index, out String text, out ParseNode parseNode)
        {
            parseNode = null;
            text = null;
            if (index >= exp.Length)
                return index;
            var i = index;

            if (i >= exp.Length || isCharWhiteSpace(exp[i]))
                return index;
            i++;
            while (i < exp.Length && !isCharWhiteSpace(exp[i]))
                i++;

            text = exp.Substring(index, i - index);
            parseNode = new ParseNode(ParseNodeType.Identifier, index, i - index);
            return i;
        }
    }
}
