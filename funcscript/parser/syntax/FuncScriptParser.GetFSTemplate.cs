using System.Text;
using funcscript.model;
using funcscript.nodes;
using System.Collections.Generic;
using funcscript.block;
using funcscript.funcs.math;

namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        public static int GetFSTemplate(IFsDataProvider provider, string exp, int index, out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            prog = null;
            var parts = new List<ExpressionBlock>();
            var nodeParts = new List<ParseNode>();

            var i = index;
            var sb = new StringBuilder();
            int i2;
            var lastIndex = i;
            while (true)
            {
                i2 = GetLiteralMatch(exp, i, "$${");
                if (i2 > i)
                {
                    sb.Append("${");
                    i = i2;
                }

                i2 = GetLiteralMatch(exp, i, "${");
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

                    i = SkipSpace(exp, i);

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
                    if (i < exp.Length)
                        continue;
                    else
                        break;
                }

                sb.Append(exp[i]);
                i++;
                if (i == exp.Length)
                    break;
            }

            if (sb.Length > 0)
            {
                parts.Add(new LiteralBlock(sb.ToString()));
                nodeParts.Add(new ParseNode(ParseNodeType.LiteralString, lastIndex, i - lastIndex));
            }

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
                    Function = new LiteralBlock(provider.Get(TemplateMergeMergeFunction.SYMBOL)),
                    Parameters = parts.ToArray()
                };
                parseNode = new ParseNode(ParseNodeType.StringTemplate, index, i - index, nodeParts);
            }

            return i;
        }
    }
}
