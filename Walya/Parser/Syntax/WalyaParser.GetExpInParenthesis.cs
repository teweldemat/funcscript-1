using Walya.Block;

namespace Walya.Core
{
    public partial class WalyaParser
    {
        static int GetExpInParenthesis(IFsDataProvider infixFuncProvider, String exp, int index,
            out ExpressionBlock expression, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            expression = null;
            var i = index;
            i = SkipSpace(exp, i);
            var i2 = GetLiteralMatch(exp, i, "(");
            if (i == i2)
                return index;
            i = i2;

            i = SkipSpace(exp, i);
            i2 = GetExpression(infixFuncProvider, exp, i, out expression, out var nodeExpression, serrors);
            if (i2 == i)
                expression = null;
            else
                i = i2;
            i = SkipSpace(exp, i);
            i2 = GetLiteralMatch(exp, i, ")");
            if (i == i2)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "')' expected"));
                return index;
            }

            i = i2;
            if (expression == null)
                expression = new NullExpressionBlock();
            parseNode = new ParseNode(ParseNodeType.ExpressionInBrace, index, i - index, new[] { nodeExpression });
            return i;
        }
    }
}
