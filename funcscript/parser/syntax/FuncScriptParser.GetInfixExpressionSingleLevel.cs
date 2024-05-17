using funcscript.funcs.math;
using funcscript.model;
using funcscript.nodes;
using System.Collections.Generic;
using funcscript.block;

namespace funcscript.core
{
    public partial class FuncScriptParser
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
                        i2 = GetCallAndMemberAccess(parseContext, exp, i, out prog, out parseNode, serrors);
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
                operands.Add(prog);
                operandNodes.Add(parseNode);
                while (true)
                {
                    ExpressionBlock nextOperand;
                    ParseNode nextOperandNode;
                    if (level == 0)
                        i2 = GetCallAndMemberAccess(parseContext, exp, i, out nextOperand, out nextOperandNode, serrors);
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
                    i = SkipSpace(exp, i2);
                }

                if (operands.Count > 1)
                {
                    var func = parseContext.Get(symbol);
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
                            Pos = prog.Pos,
                            Length = operands[^1].Pos + operands[^1].Length - prog.Length
                        };

                        parseNode = new ParseNode(ParseNodeType.InfixExpression, parseNode!.Pos,
                            operandNodes[^1].Pos + operandNodes[^1].Length - parseNode.Length);
                    }
                    else if (func is SigSequenceFunction)
                    {
                        prog = new FunctionCallExpression
                        {
                            Function = new LiteralBlock(func),
                            Parameters = new ExpressionBlock[]
                            {
                                new ListExpression
                                {
                                    ValueExpressions = operands.ToArray()
                                }
                            },
                            Pos = prog.Pos,
                            Length = operands[^1].Pos + operands[^1].Length - prog.Length
                        };
                        parseNode = new ParseNode(ParseNodeType.InfixExpression, parseNode!.Pos,
                            operandNodes[^1].Pos + operandNodes[^1].Length - parseNode.Length);
                    }
                    else
                    {
                        prog = new FunctionCallExpression
                        {
                            Function = new LiteralBlock(func),
                            Parameters = operands.ToArray(),
                            Pos = prog.Pos,
                            Length = operands[^1].Pos + operands[^1].Length - prog.Length
                        };
                        parseNode = new ParseNode(ParseNodeType.InfixExpression, parseNode!.Pos,
                            operandNodes[^1].Pos + operandNodes[^1].Length - parseNode.Length);
                    }
                }
            }
            return i;
        }
    }
}
