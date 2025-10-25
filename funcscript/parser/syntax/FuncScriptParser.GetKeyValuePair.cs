using funcscript.block;

namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        static int GetKeyValuePair(IFsDataProvider context, string exp, int index,
            out KvcExpression.KeyValueExpression keyValue, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            keyValue = null;
            string name;
            var i = GetSimpleString(exp, index, out name, out var nodeNeme, new List<SyntaxErrorData>());
            if (i == index)
            {
                i = GetIdentifier(exp, index, out name, out var nameLower, out nodeNeme);
                if (i == index)
                    return index;
            }

            i = SkipSpace(exp, i);

            var i2 = GetLiteralMatch(exp, i, ":");
            if (i2 == i)
                return index;

            i = i2;

            i = SkipSpace(exp, i);
            i2 = GetExpression(context, exp, i, out var expBlock, out var nodeExpBlock, serrors);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "value expression expected"));
                return index;
            }

            i = i2;
            i = SkipSpace(exp, i);
            keyValue = new KvcExpression.KeyValueExpression
            {
                Key = name,
                ValueExpression = expBlock
            };
            nodeNeme.NodeType = ParseNodeType.Key;
            parseNode = new ParseNode(ParseNodeType.KeyValuePair, index, i - index, new[] { nodeNeme, nodeExpBlock });
            return i;
        }
    }
}
