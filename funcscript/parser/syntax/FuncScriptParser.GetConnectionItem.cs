using funcscript.model;
using funcscript.nodes;
using System.Collections.Generic;
using funcscript.block;

namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        static int GetConnectionItem(IFsDataProvider context, string exp, int index,
            out KvcExpression.ConnectionExpression connectionExpression, out ParseNode parseNode,
            ParseNodeType nodeType)
        {
            connectionExpression = null;
            parseNode = null;

            var errors = new List<SyntaxErrorData>();
            var i = GetExpression(context, exp, index, out var sourceExp, out var nodeSourceExp, errors);
            if (i <= index)
            {
                return index; // Failed to parse any expression at all.
            }

            i = SkipSpace(exp, i);
            // Ensure we have a '->' after the source expression
            var i2 = GetLiteralMatch(exp, i, nodeType == ParseNodeType.DataConnection ? ":->" : "->");
            if (i2 == i)
            {
                return index; // No '->' found immediately after the source expression.
            }

            i = SkipSpace(exp, i2);


            i2 = GetExpression(context, exp, i, out var sinkExp, out var nodeSinkExp, errors);
            if (i2 <= i)
            {
                errors.Add(new SyntaxErrorData(i, 0, "Sink expression expected"));
                return index; // Failed to parse the sink expression.
            }

            i = SkipSpace(exp, i2);
            if (sinkExp is ListExpression lst)
            {
                if (lst.ValueExpressions.Length != 2)
                {
                    errors.Add(new SyntaxErrorData(i, 0, "Exactly two items, sink and fault are expected"));
                    return index; // Failed to parse the sink expression.
                }

                connectionExpression = new KvcExpression.ConnectionExpression
                {
                    Source = sourceExp,
                    Sink = lst.ValueExpressions[0],
                    Catch = lst.ValueExpressions[1],
                };
                parseNode = new ParseNode
                (
                    nodeType,
                    index,
                    i - index,
                    new ParseNode[] { nodeSourceExp, nodeSinkExp }
                );
            }
            else
            {
                connectionExpression = new KvcExpression.ConnectionExpression
                {
                    Source = sourceExp,
                    Sink = sinkExp,
                };
                parseNode = new ParseNode
                (
                    ParseNodeType.DataConnection,
                    index,
                    i - index,
                    new ParseNode[] { nodeSourceExp, nodeSinkExp }
                );
            }

            return i;
        }
    }
}
