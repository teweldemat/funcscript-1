using Walya.Model;
using System.Collections.Generic;
using Walya.Block;

namespace Walya.Core
{
    public partial class WalyaParser
    {
        static int GetFunctionCallParametersList(IFsDataProvider context, ExpressionBlock func, String exp, int index,
            out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            var i = GetFunctionCallParametersList(context, "(", ")", func, exp, index, out prog, out parseNode,
                serrors);
            if (i == index)
                return GetFunctionCallParametersList(context, "[", "]", func, exp, index, out prog, out parseNode,
                    serrors);
            return i;
        }

        static int GetFunctionCallParametersList(IFsDataProvider context, String openBrance, String closeBrance,
            ExpressionBlock func, String exp, int index, out ExpressionBlock prog, out ParseNode parseNode,
            List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            prog = null;

            //make sure we have open brace
            var i = SkipSpace(exp, index);
            var i2 = GetLiteralMatch(exp, i, openBrance);
            if (i == i2)
                return index; //we didn't find '('
            i = i2;
            var pars = new List<ExpressionBlock>();
            var parseNodes = new List<ParseNode>();
            //lets get first parameter
            i = SkipSpace(exp, i);
            i2 = GetExpression(context, exp, i, out var par1, out var parseNode1, serrors);
            if (i2 > i)
            {
                i = i2;
                pars.Add(par1);
                parseNodes.Add(parseNode1);
                do
                {
                    i2 = SkipSpace(exp, i);
                    if (i2 >= exp.Length || exp[i2++] != ',') //stop collection of paramters if there is no ','
                        break;
                    i = i2;
                    i = SkipSpace(exp, i);
                    i2 = GetExpression(context, exp, i, out var par2, out var parseNode2, serrors);
                    if (i2 == i)
                    {
                        serrors.Add(new SyntaxErrorData(i, 0, "Parameter for call expected"));
                        return index;
                    }

                    i = i2;
                    pars.Add(par2);
                    parseNodes.Add(parseNode2);
                } while (true);
            }

            i = SkipSpace(exp, i);
            i2 = GetLiteralMatch(exp, i, closeBrance);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, $"'{closeBrance}' expected"));
                return index;
            }

            i = i2;


            prog = new FunctionCallExpression
            {
                Function = func,
                Parameters = pars.ToArray(),
                Pos = func.Pos,
                Length = i - func.Pos,
            };
            parseNode = new ParseNode(ParseNodeType.FunctionParameterList, index, i - index, parseNodes);
            return i;
        }
    }
}
