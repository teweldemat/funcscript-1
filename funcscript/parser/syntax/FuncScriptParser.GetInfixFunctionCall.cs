using funcscript.block;

namespace funcscript.core
{
    public partial class FuncScriptParser
    {
        static int GetInfixFunctionCall(IFsDataProvider parseContext, string exp, int index, out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            var childNodes = new List<ParseNode>();
            var allOperands = new List<ExpressionBlock>();

            var i = GetCallAndMemberAccess(parseContext, exp, index, out var firstParam, out var firstPramNode,
                serrors);
            if (i == index)
            {
                prog = null;
                parseNode = null;
                return index;
            }
            prog = firstParam;
            parseNode = firstPramNode;


            allOperands.Add(firstParam);
            childNodes.Add(firstPramNode);
            i = SkipSpace(exp, i);

            var i2 = GetIdentifier(exp, i, out var iden, out var idenLower, out var idenNode);
            if (i2 == i)
            {
                return i;
            }
            var func = parseContext.Get(idenLower);
            if (!(func is IFsFunction inf))
            {
                prog = null;
                parseNode = null;
                serrors.Add(new SyntaxErrorData(i,i2-i,"A function expected"));
                return index;
            }
            if (inf.CallType!=CallType.Dual)
            {
                return i;
            }

            
            childNodes.Add(idenNode);
            i = SkipSpace(exp, i2);

            i2 = GetCallAndMemberAccess(parseContext, exp, i, out var secondParam, out var secondParamNode, serrors);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, $"Right side operand expected for {iden}"));
                prog = null;
                parseNode = null;
                return index;
            }

            allOperands.Add(secondParam);
            childNodes.Add(secondParamNode);
            i = SkipSpace(exp, i2);


            while (true)
            {
                i2 = GetLiteralMatch(exp, i, "~");
                if (i2 == i)
                    break;
                i = SkipSpace(exp, i2);
                i2 = GetCallAndMemberAccess(parseContext, exp, i, out var moreOperand, out var morePrseNode, serrors);
                if (i2 == i)
                    break;
                i = SkipSpace(exp, i2);

                allOperands.Add(moreOperand);
                childNodes.Add(morePrseNode);
            }


            if (allOperands.Count < 2)
            {
                prog = null;
                parseNode = null;
                return index;
            }

            prog = new FunctionCallExpression
            {
                Function = new LiteralBlock(func),
                Parameters = allOperands.ToArray()
            };
            parseNode = new ParseNode(ParseNodeType.GeneralInfixExpression, childNodes[0].Pos,
                childNodes[^1].Pos + childNodes[^1].Length + childNodes[0].Pos);

            return i;
        }
    }
}
