using FuncScript.Block;

namespace FuncScript.Core
{
    public partial class FuncScriptParser
    {
        static int GetSwitchExpression(IFsDataProvider context, String exp, int index, out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            prog = null;
            parseNode = null;
            var i = index;
            var i2 = GetLiteralMatch(exp, i, KW_SWITCH);
            if (i2 == i)
                return index;
            i = SkipSpace(exp, i2);
            var pars = new List<ExpressionBlock>();
            var childNodes = new List<ParseNode>();
            i2 = GetExpression(context, exp, i, out var partSelector, out var nodeSelector, serrors);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 1, "Switch selector expected"));
                return index;
            }

            pars.Add(partSelector);
            childNodes.Add(nodeSelector);
            i = SkipSpace(exp, i2);
            do
            {
                i2 = GetLiteralMatch(exp, i, ",", ";");
                if (i2 == i)
                    break;
                i = SkipSpace(exp, i2);
                i2 = GetExpression(context, exp, i, out var part1, out var part1Node, serrors);
                if (i2 == i)
                {
                    break;
                }

                i = SkipSpace(exp, i2);
                pars.Add(part1);
                childNodes.Add(part1Node);

                i2 = GetLiteralMatch(exp, i, ":");
                if (i2 == i)
                {
                    break;
                }

                i = SkipSpace(exp, i2);
                i2 = GetExpression(context, exp, i, out var part2, out var part2Node, serrors);
                if (i2 == i)
                {
                    serrors.Add(new SyntaxErrorData(i, 1, "Selector result expected"));
                    return index;
                }

                pars.Add(part2);
                childNodes.Add(part2Node);
                i = SkipSpace(exp, i2);
            } while (true);

            prog = new FunctionCallExpression
            {
                Function = new LiteralBlock(context.Get(KW_SWITCH)),
                Pos = index,
                Length = i - index,
                Parameters = pars.ToArray(),
            };
            parseNode = new ParseNode(ParseNodeType.Case, index, index - i);
            parseNode.Childs = childNodes;
            return i;
        }
    }
}
