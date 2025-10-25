using funcscript.block;

namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        static int GetListExpression(IFsDataProvider context, String exp, int index, out ListExpression listExpr,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            listExpr = null;
            var i = SkipSpace(exp, index);
            var i2 = GetLiteralMatch(exp, i, "[");
            if (i2 == i)
                return index; //we didn't find '['
            i = i2;

            var listItems = new List<ExpressionBlock>();
            var nodeListItems = new List<ParseNode>();
            i = SkipSpace(exp, i);
            i2 = GetExpression(context, exp, i, out var firstItem, out var nodeFirstItem, serrors);
            if (i2 > i)
            {
                listItems.Add(firstItem);
                nodeListItems.Add(nodeFirstItem);
                i = i2;
                do
                {
                    i = SkipSpace(exp, i);
                    i2 = GetLiteralMatch(exp, i, ",");
                    if (i2 == i)
                        break;
                    i = i2;

                    i = SkipSpace(exp, i);
                    i2 = GetExpression(context, exp, i, out var otherItem, out var nodeOtherItem, serrors);
                    if (i2 == i)
                        break;
                    listItems.Add(otherItem);
                    nodeListItems.Add(nodeOtherItem);
                    i = i2;
                } while (true);
            }

            i = SkipSpace(exp, i);
            i2 = GetLiteralMatch(exp, i, "]");
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "']' expected"));
                return index;
            }

            i = i2;
            listExpr = new ListExpression { ValueExpressions = listItems.ToArray() };
            parseNode = new ParseNode(ParseNodeType.List, index, i - index, nodeListItems);
            return i;
        }
    }
}
