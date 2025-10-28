using FunscScript.Block;

namespace FunscScript.Core
{
    public partial class FunscScriptParser
    {
        static int GetCallAndMemberAccess(IFsDataProvider parseContext, String exp, int index, out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            prog = null;
            var i1 = SkipSpace(exp, index);
            var i = GetUnit(parseContext, exp, i1, out var theUnit, out parseNode, serrors);
            if (i == index)
                return index;

            do
            {
                //lets see if this is part of a function call
                var i2 = GetFunctionCallParametersList(parseContext, theUnit, exp, i, out var funcCall,
                    out var nodeParList, serrors);
                if (i2 > i)
                {
                    i = i2;
                    theUnit = funcCall;
                    parseNode = new ParseNode(ParseNodeType.FunctionCall, index, i - index,
                        new[] { parseNode, nodeParList });
                    continue;
                }

                i2 = GetMemberAccess(parseContext, theUnit, exp, i, out var memberAccess, out var nodeMemberAccess,
                    serrors);
                if (i2 > i)
                {
                    i = i2;
                    theUnit = memberAccess;
                    parseNode = new ParseNode(ParseNodeType.MemberAccess, index, i - index,
                        new[] { parseNode, nodeMemberAccess });
                    continue;
                }

                i2 = GetKvcExpression(parseContext, false, exp, i, out var kvc, out var nodeKvc, serrors);
                if (i2 > i)
                {
                    i = i2;
                    theUnit = new SelectorExpression
                    {
                        Source = theUnit,
                        Selector = kvc,
                        Pos = i,
                        Length = i2 - i
                    };
                    parseNode = new ParseNode(ParseNodeType.Selection, index, i - index, new[] { parseNode, nodeKvc });
                    continue;
                }

                prog = theUnit;
                return i;
            } while (true);
        }
    }
}
