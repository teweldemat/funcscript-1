using funcscript.block;
using funcscript.funcs.math;
using System.Text;
using System.Text.RegularExpressions;
using funcscript.funcs.logic;
using funcscript.model;
using funcscript.nodes;
using System.Collections.Generic;

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

            allOperands.Add(firstParam);
            childNodes.Add(firstPramNode);
            i = SkipSpace(exp, i);

            var i2 = GetIdentifier(exp, i, out var iden, out var idenLower, out var idenNode);
            if (i2 == i)
            {
                prog = null;
                parseNode = null;
                return index;
            }

            childNodes.Add(idenNode);
            i = SkipSpace(exp, i2);

            i2 = GetInfixExpression(parseContext, exp, i, out var secondParam, out var secondParamNode, serrors);
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
                i2 = GetInfixExpression(parseContext, exp, i, out var moreOperand, out var morePrseNode, serrors);
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

            var func = parseContext.Get(idenLower);
            prog = new FunctionCallExpression
            {
                Function = func == null ? new ReferenceBlock(iden, idenLower) : new LiteralBlock(func),
                Parameters = allOperands.ToArray()
            };
            parseNode = new ParseNode(ParseNodeType.GeneralInfixExpression, childNodes[0].Pos,
                childNodes[^1].Pos + childNodes[^1].Length + childNodes[0].Pos);

            return i;
        }
    }
}
