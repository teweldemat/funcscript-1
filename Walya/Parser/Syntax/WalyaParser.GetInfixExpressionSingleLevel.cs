using Walya.Functions.Math;
using Walya.Model;
using System.Collections.Generic;
using Walya.Block;

namespace Walya.Core
{
    public partial class WalyaParser
    {
        static int GetInfixExpressionSingleLevel(IFsDataProvider parseContext, int level, string[] candidates,
            string exp, int index,
            out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            prog = null; 
            parseNode = null;
            var i = index;
            while (true)
            {
                int i2;
                IFsFunction oper = null;
                ParseNode operatorNode = null;
                string symbol = null;
                
                if (prog == null) //if we parsing the first operaand
                {
                    //get an infix with one level higher or call expression when we are parsing for highest precidence operators
                    if (level == 0)
                    {
                        i2 = GetInfixFunctionCall(parseContext, exp, i, out prog, out parseNode, serrors);
                    }
                    else
                    {
                        i2 = GetInfixExpressionSingleLevel(parseContext, level - 1, s_operatorSymols[level - 1], exp, i,
                            out prog, out parseNode,
                            serrors);
                    }

                    if (i2 == i)
                        return i;

                    i = SkipSpace(exp, i2);
                    continue;
                }

                var indexBeforeOperator = i;
                i2 = GetOperator(parseContext, candidates, exp, i, out symbol, out oper,
                    out operatorNode);
                if (i2 == i)
                    break;

                i = SkipSpace(exp, i2);

                var operands = new List<ExpressionBlock>();
                var operandNodes = new List<ParseNode>();
                var operatorNodes = new List<ParseNode>();
                operands.Add(prog);
                operandNodes.Add(parseNode);
                if (operatorNode != null)
                    operatorNodes.Add(operatorNode);
                while (true)
                {
                    ExpressionBlock nextOperand;
                    ParseNode nextOperandNode;
                    if (level == 0)
                        i2 = GetInfixFunctionCall(parseContext, exp, i, out nextOperand, out nextOperandNode, serrors);
                    else
                        i2 = GetInfixExpressionSingleLevel(parseContext, level - 1, s_operatorSymols[level - 1], exp, i, out nextOperand, out nextOperandNode, serrors);
                    if (i2 == i)
                        return indexBeforeOperator;
                    operands.Add(nextOperand);
                    operandNodes.Add(nextOperandNode);
                    i = SkipSpace(exp, i2);

                    i2 = GetLiteralMatch(exp, i, symbol);
                    if (i2 == i)
                        break;
                    if (i2 > i)
                        operatorNodes.Add(new ParseNode(ParseNodeType.Operator, i, i2 - i));
                    i = SkipSpace(exp, i2);
                }

                if (operands.Count > 1)
                {
                    var func = parseContext.Get(symbol);
                    var firstOperand = operands[0];
                    var lastOperand = operands[^1];
                    var startPos = firstOperand.Pos;
                    var endPos = lastOperand.Pos + lastOperand.Length;
                    if (endPos < startPos)
                        endPos = startPos;
                    var spanLength = endPos - startPos;

                    var primaryOperatorNode = operatorNodes.Count > 0 ? operatorNodes[0] : operatorNode;

                    if (symbol == "|")
                    {
                        if (operands.Count > 2)
                        {
                            serrors.Add(new SyntaxErrorData(i, 0, "Only two parameters expected for | "));
                            return i;
                        }

                        prog = new ListExpression
                        {
                            ValueExpressions = operands.ToArray(),
                            Pos = startPos,
                            Length = spanLength
                        };

                        parseNode = new ParseNode(ParseNodeType.InfixExpression, startPos, spanLength);
                    }
                    else
                    {
                        var functionLiteral = new LiteralBlock(func)
                        {
                            Pos = primaryOperatorNode?.Pos ?? startPos,
                            Length = primaryOperatorNode?.Length ?? 0
                        };
                        prog = new FunctionCallExpression
                        {
                            Function = functionLiteral,
                            Parameters = operands.ToArray(),
                            Pos = startPos,
                            Length = spanLength
                        };
                    }

                    var infixChildren = new List<ParseNode>();
                    ParseNode firstChild = null;
                    ParseNode lastChild = null;

                    for (int childIndex = 0; childIndex < operandNodes.Count; childIndex++)
                    {
                        var operandNode = operandNodes[childIndex];
                        if (operandNode != null)
                        {
                            infixChildren.Add(operandNode);
                            if (firstChild == null)
                                firstChild = operandNode;
                            lastChild = operandNode;
                        }

                        if (childIndex < operatorNodes.Count)
                        {
                            var opNode = operatorNodes[childIndex];
                            if (opNode != null)
                            {
                                infixChildren.Add(opNode);
                                lastChild = opNode;
                            }
                        }
                    }

                    if (firstChild != null && lastChild != null)
                    {
                        var firstPos = firstChild.Pos;
                        var lastPos = lastChild.Pos + lastChild.Length;
                        var length = lastPos - firstPos;
                        if (length < 0)
                            length = 0;
                        parseNode = new ParseNode(ParseNodeType.InfixExpression, firstPos, length, infixChildren);
                    }
                }
            }
            return i;
        }
    }
}
