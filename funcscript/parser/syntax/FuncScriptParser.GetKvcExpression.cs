using FuncScript.Block;

namespace FuncScript.Core
{
    public partial class FuncScriptParser
    {
        static int GetKvcExpression(IFsDataProvider context, bool nakdeMode, String exp, int index,
            out KvcExpression kvcExpr,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            kvcExpr = null;
            var i = SkipSpace(exp, index);
            int i2;
            if (!nakdeMode)
            {
                i2 = GetLiteralMatch(exp, i, "{");
                if (i2 == i)
                    return index;
                i = SkipSpace(exp, i2);
            }

            var kvs = new List<KvcExpression.KeyValueExpression>();
            var dataConnections = new List<KvcExpression.ConnectionExpression>();
            var signalConnections = new List<KvcExpression.ConnectionExpression>();
            var nodeItems = new List<ParseNode>();
            ExpressionBlock retExp = null;
            do
            {
                if (kvs.Count > 0 || retExp != null || dataConnections.Count > 0 || signalConnections.Count > 0)
                {
                    i2 = GetLiteralMatch(exp, i, ",", ";");
                    if (i2 == i)
                        break;
                    i = SkipSpace(exp, i2);
                }

                i2 = GetConnectionItem(context, exp, i, out var dataConItem, out var datanCodeConItem,
                    ParseNodeType.DataConnection);
                if (i2 > i)
                {
                    dataConnections.Add(dataConItem);
                    nodeItems.Add(datanCodeConItem);
                    i = SkipSpace(exp, i2);
                    continue;
                }


                i2 = GetConnectionItem(context, exp, i, out var sigConItem, out var signNodeConItem,
                    ParseNodeType.SignalConnection);
                if (i2 > i)
                {
                    signalConnections.Add(sigConItem);
                    nodeItems.Add(signNodeConItem);
                    i = SkipSpace(exp, i2);
                    continue;
                }


                i2 = GetKvcItem(context, nakdeMode, exp, i, out var otherItem, out var nodeOtherItem);
                if (i2 == i)
                    break;
                if (otherItem.Key == null)
                {
                    if (retExp != null)
                    {
                        serrors.Add(new SyntaxErrorData(nodeOtherItem.Pos, nodeItems.Count,
                            "Duplicate return statement"));
                        return index;
                    }

                    retExp = otherItem.ValueExpression;
                }
                else
                    kvs.Add(otherItem);

                nodeItems.Add(nodeOtherItem);
                i = SkipSpace(exp, i2);
            } while (true);

            if (!nakdeMode)
            {
                i2 = GetLiteralMatch(exp, i, "}");
                if (i2 == i)
                {
                    serrors.Add(new SyntaxErrorData(i, 0, "'}' expected"));
                    return index;
                }

                i = SkipSpace(exp, i2);
            }

            if (nakdeMode)
            {
                if (kvs.Count == 0 && retExp == null && dataConnections.Count == 0 && signalConnections.Count == 0)
                    return index;
            }

            kvcExpr = new KvcExpression();
            var error = kvcExpr.SetKeyValues(kvs.ToArray(), retExp, dataConnections.ToArray(),
                signalConnections.ToArray());
            if (error != null)
            {
                serrors.Add(new SyntaxErrorData(index, i - index, error));
                return index;
            }

            parseNode = new ParseNode(ParseNodeType.KeyValueCollection, index, i - index, nodeItems);
            return i;
        }
    }
}
