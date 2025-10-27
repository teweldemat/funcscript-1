
namespace FuncScript.Core
{
    public partial class FuncScriptParser
    {
        static int GetSpaceSepratedStringListExpression(IFsDataProvider context, String exp, int index,
            out List<string> stringList, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            stringList = null;
            var i = SkipSpace(exp, index);

            var listItems = new List<String>();
            var nodeListItems = new List<ParseNode>();
            String firstItem;
            ParseNode firstNode;

            String otherItem;
            ParseNode otherNode;
            var i2 = GetSimpleString(exp, i, out firstItem, out firstNode, serrors);
            if (i2 == i)
                i2 = GetSpaceLessString(exp, i, out firstItem, out firstNode);
            if (i2 > i)
            {
                listItems.Add(firstItem);
                nodeListItems.Add(firstNode);
                i = i2;
                do
                {
                    i2 = GetLiteralMatch(exp, i, " ");
                    if (i2 == i)
                        break;
                    i = i2;
                    i = SkipSpace(exp, i);
                    i2 = GetSimpleString(exp, i, out otherItem, out otherNode, serrors);
                    if (i2 == i)
                        i2 = GetSpaceLessString(exp, i, out otherItem, out otherNode);

                    if (i2 == i)
                        break;
                    listItems.Add(otherItem);
                    nodeListItems.Add(otherNode);
                    i = i2;
                } while (true);
            }

            stringList = listItems;
            parseNode = new ParseNode(ParseNodeType.List, index, i - index, nodeListItems);
            return i;
        }
    }
}
