
namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        static int GetReturnDefinition(IFsDataProvider context, String exp, int index, out ExpressionBlock retExp,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            retExp = null;
            var i = GetLiteralMatch(exp, index, KW_RETURN);
            if (i == index)
                return index;
            var nodeReturn = new ParseNode(ParseNodeType.KeyWord, index, i - index);
            i = SkipSpace(exp, i);
            var i2 = GetExpression(context, exp, i, out var expBlock, out var nodeExpBlock, serrors);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "return expression expected"));
                return index;
            }

            i = i2;
            retExp = expBlock;
            retExp.Pos = index;
            retExp.Length = i - index;
            parseNode = new ParseNode(ParseNodeType.ExpressionInBrace, index, i - index,
                new[] { nodeReturn, nodeExpBlock });

            return i;
        }
    }
}
