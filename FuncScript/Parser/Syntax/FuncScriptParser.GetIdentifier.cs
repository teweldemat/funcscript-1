using FuncScript.Core;

namespace FuncScript.Core
{
    public partial class FuncScriptParser
    {
        static int GetIdentifier(String exp, int index, out String iden, out String idenLower, out ParseNode parseNode)
        {
            parseNode = null;
            iden = null;
            idenLower = null;
            if (index >= exp.Length)
                return index;
            var i = index;
            if (!IsIdentfierFirstChar(exp[i]))
                return index;
            i++;
            while (i < exp.Length && IsIdentfierOtherChar(exp[i]))
            {
                i++;
            }

            iden = exp.Substring(index, i - index);
            idenLower = iden.ToLower();
            if (s_KeyWords.Contains(idenLower))
                return index;
            parseNode = new ParseNode(ParseNodeType.Identifier, index, i - index);
            return i;
        }
    }
}
