using System.Text;
using funcscript.block;

namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        static int GetStringTemplate(IFsDataProvider provider, string exp, int index, out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            var i = GetStringTemplate(provider, "\"", exp, index, out prog, out parseNode, serrors);
            if (i > index)
                return i;
            return GetStringTemplate(provider, "'", exp, index, out prog, out parseNode, serrors);
        }

        static int GetStringTemplate(IFsDataProvider provider, String delimator, string exp, int index,
            out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            prog = null;
            var parts = new List<ExpressionBlock>();
            var nodeParts = new List<ParseNode>();


            var i = GetLiteralMatch(exp, index, $"f{delimator}");
            if (i == index)
                return index;
            var lastIndex = i;
            var sb = new StringBuilder();
            int i2;
            while (true)
            {
                i2 = GetLiteralMatch(exp, i, @"\\");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append('\\');
                    continue;
                }

                i2 = GetLiteralMatch(exp, i, @"\n");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append('\n');
                    continue;
                }

                i2 = GetLiteralMatch(exp, i, @"\t");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append('\t');
                    continue;
                }

                i2 = GetLiteralMatch(exp, i, $@"\{delimator}");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append(delimator);
                    continue;
                }

                i2 = GetLiteralMatch(exp, i, @"\{");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append("{");
                    continue;
                }

                i2 = GetLiteralMatch(exp, i, "{");
                if (i2 > i)
                {
                    if (sb.Length > 0)
                    {
                        parts.Add(new LiteralBlock(sb.ToString()));
                        nodeParts.Add(new ParseNode(ParseNodeType.LiteralString, lastIndex, i - lastIndex));
                        sb = new StringBuilder();
                    }

                    i = i2;

                    i = SkipSpace(exp, i);
                    i2 = GetExpression(provider, exp, i, out var expr, out var nodeExpr, serrors);
                    if (i2 == i)
                    {
                        serrors.Add(new SyntaxErrorData(i, 0, "expression expected"));
                        return index;
                    }

                    parts.Add(expr);
                    nodeParts.Add(nodeExpr);
                    i = i2;
                    i2 = GetLiteralMatch(exp, i, "}");
                    if (i2 == i)
                    {
                        serrors.Add(new SyntaxErrorData(i, 0, "'}' expected"));
                        return index;
                    }

                    i = i2;
                    lastIndex = i;
                    continue;
                }

                if (i >= exp.Length || GetLiteralMatch(exp, i, delimator) > i)
                    break;
                sb.Append(exp[i]);
                i++;
            }

            if (i > lastIndex)
            {
                if (sb.Length > 0)
                {
                    parts.Add(new LiteralBlock(sb.ToString()));
                    nodeParts.Add(new ParseNode(ParseNodeType.LiteralString, lastIndex, i - lastIndex));
                    sb = new StringBuilder();
                }

                nodeParts.Add(new ParseNode(ParseNodeType.LiteralString, lastIndex, i - lastIndex));
            }

            i2 = GetLiteralMatch(exp, i, delimator);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, $"'{delimator}' expected"));
                return index;
            }

            i = i2;

            if (parts.Count == 0)
            {
                prog = new LiteralBlock("");
                parseNode = new ParseNode(ParseNodeType.LiteralString, index, i - index);
            }

            if (parts.Count == 1)
            {
                prog = parts[0];
                parseNode = nodeParts[0];
            }
            else
            {
                prog = new FunctionCallExpression
                {
                    Function = new LiteralBlock(provider.Get("+")),
                    Parameters = parts.ToArray()
                };
                parseNode = new ParseNode(ParseNodeType.StringTemplate, index, i - index, nodeParts);
            }

            return i;
        }
    }
}
