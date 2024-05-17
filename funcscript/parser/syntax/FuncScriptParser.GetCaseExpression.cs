using funcscript.block;
using funcscript.model;
using funcscript.nodes;
using System.Collections.Generic;

namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        static int GetCaseExpression(IFsDataProvider context, String exp, int index, out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            prog = null;
            parseNode = null;
            var i = index;
            var i2 = GetLiteralMatch(exp, i, KW_CASE);
            if (i2 == i)
                return index;
            i = SkipSpace(exp, i2);
            var pars = new List<ExpressionBlock>();
            var childNodes = new List<ParseNode>();
            do
            {
                if (pars.Count == 0)
                {
                    i2 = GetExpression(context, exp, i, out var part1, out var part1Node, serrors);
                    if (i2 == i)
                    {
                        serrors.Add(new SyntaxErrorData(i, 1, "Case condition expected"));
                        return index;
                    }

                    pars.Add(part1);
                    childNodes.Add(part1Node);
                    i = SkipSpace(exp, i2);
                }
                else
                {
                    i2 = GetLiteralMatch(exp, i, ",", ";");
                    if (i2 == i)
                        break;
                    i = SkipSpace(exp, i2);
                    i2 = GetExpression(context, exp, i, out var part1, out var part1Node, serrors);
                    if (i2 == i)
                        break;
                    pars.Add(part1);
                    childNodes.Add(part1Node);
                    i = SkipSpace(exp, i2);
                }

                i2 = GetLiteralMatch(exp, i, ":");
                if (i2 == i)
                {
                    break;
                }

                i = SkipSpace(exp, i2);
                i2 = GetExpression(context, exp, i, out var part2, out var part2Node, serrors);
                if (i2 == i)
                {
                    serrors.Add(new SyntaxErrorData(i, 1, "Case value expected"));
                    return index;
                }

                pars.Add(part2);
                childNodes.Add(part2Node);
                i = SkipSpace(exp, i2);
            } while (true);

            prog = new FunctionCallExpression
            {
                Function = new LiteralBlock(context.GetData(KW_CASE)),
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
