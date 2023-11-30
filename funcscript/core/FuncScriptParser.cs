using funcscript.block;
using funcscript.funcs.math;
using System.Collections.Generic;
using System.Text;
using System.Xml.Serialization;

namespace funcscript.core
{

    public class FuncScriptParser
    {
        public enum ParseNodeType
        {
            Comment,
            FunctionParameterList,
            FunctionCall,
            MemberAccess,
            Selection,
            InfixExpression,
            LiteralInteger,
            KeyWord,
            LiteralDouble,
            LiteralLong,
            Identifier,
            IdentiferList,
            Operator,
            LambdaExpression,
            ExpressionInBrace,
            LiteralString,
            StringTemplate,
            KeyValuePair,
            KeyValueCollection,
            List,
            Key,
            Case
        }

        public class SyntaxErrorData
        {
            public int Loc;
            public int Length;
            public String Message;

            public SyntaxErrorData(int loc, int length, string message)
            {
                Loc = loc;
                Message = message;
                Length = length;
            }
        }
        public class ParseNode
        {
            public ParseNodeType NodeType;
            public int Pos;
            public int Length;
            public IList<ParseNode> Childs;
            public ParseNode(ParseNodeType type, int pos, int length)
                : this(type, pos, length, null)
            {

            }
            public ParseNode(ParseNodeType nodeType, int pos, int length, IList<ParseNode> childs)
            {
                NodeType = nodeType;
                Pos = pos;
                Length = length;
                Childs = childs;
            }
        }
        static String[] s_SingleLetterOps = new String[] { "+", "*", "-", "/", "^", ">", "<", "%", "=" };
        static String[] s_DoubleLetterOps = new String[] { ">=", "<=", "!=", "??", "?!", "?." };
        
        

        const string KW_RETURN = "return";
        const string KW_CASE = "case";
        static HashSet<string> s_KeyWords;
        static FuncScriptParser()
        {
            s_KeyWords = new HashSet<string>();
            s_KeyWords.Add(KW_RETURN);
        }
        static bool isCharWhiteSpace(char ch)
                        => ch == ' ' ||
                            ch == '\r' ||
                        ch == '\t' ||
                        ch == '\n';
        static int SkipSpace(String exp, int index)
        {
            int i = index;
            while (index < exp.Length)
            {
                if (isCharWhiteSpace(exp[index]))
                {
                    index++;
                }
                else
                {
                    i = GetCommentBlock(exp, index, out var nodeComment);
                    if (i == index)
                        break;
                    index = i;
                }
            }
            return index;
        }
        static int GetInt(String exp, bool allowNegative, int index, out string intVal, out ParseNode parseNode)
        {
            parseNode = null;
            int i = index;
            if (allowNegative)
                i = GetLiteralMatch(exp, i, "-");

            var i2 = i;
            while (i2 < exp.Length && char.IsDigit(exp[i2]))
                i2++;

            if (i == i2)
            {
                intVal = null;
                return index;
            }
            i = i2;

            intVal = exp.Substring(index, i - index);
            parseNode = new ParseNode(ParseNodeType.LiteralInteger, index, index - i);
            return i;
        }
        static int GetKeyWordLiteral(String exp, int index, out object literal, out ParseNode parseNode)
        {
            parseNode = null;
            var i = GetLiteralMatch(exp, index, "null");
            if (i > index)
            {
                literal = null;
            }
            else if ((i = GetLiteralMatch(exp, index, "true")) > index)
            {
                literal = true;
            }
            else if ((i = GetLiteralMatch(exp, index, "false")) > index)
            {
                literal = false;
            }
            else
            {
                literal = null;
                return index;
            }
            parseNode = new ParseNode(ParseNodeType.KeyWord, index, i - index);
            return i;
        }
        static int GetNumber(String exp, int index, out object number, out ParseNode parseNode, List<SyntaxErrorData> serros)
        {
            parseNode = null;
            var hasDecimal = false;
            var hasExp = false;
            var hasLong = false;
            number = null;
            int i = index;
            var i2 = GetInt(exp, true, i, out var intDigits, out var nodeDigits);
            if (i2 == i)
                return index;
            i = i2;

            i2 = GetLiteralMatch(exp, i, ".");
            if (i2 > i)
                hasDecimal = true;
            i = i2;
            if (hasDecimal)
            {
                i = GetInt(exp, false, i, out var decimalDigits, out var nodeDecimlaDigits);
            }
            i2 = GetLiteralMatch(exp, i, "E");
            if (i2 > i)
                hasExp = true;
            i = i2;
            String expDigits = null;
            ParseNode nodeExpDigits;
            if (hasExp)
                i = GetInt(exp, true, i, out expDigits, out nodeExpDigits);

            if (!hasDecimal) //if no decimal we check if there is the 'l' suffix
            {
                i2 = GetLiteralMatch(exp, i, "l");
                if (i2 > i)
                    hasLong = true;
                i = i2;
            }
            if (hasDecimal) //if it has decimal we treat it as 
            {

                if (!double.TryParse(exp.Substring(index, i - index), out var dval))
                {
                    serros.Add(new SyntaxErrorData(index, i - index, $"{exp.Substring(index, i - index)} couldn't be parsed as floating point"));
                    return index; //we don't expect this to happen
                }
                number = dval;
                parseNode = new ParseNode(ParseNodeType.LiteralDouble, index, i - index);
                return i;
            }

            if (hasExp) //it e is included without decimal, zeros are appended to the digits
            {
                if (!int.TryParse(expDigits, out var e) || e < 0)
                {
                    serros.Add(new SyntaxErrorData(index, expDigits == null ? 0 : expDigits.Length, $"Invalid exponentional {expDigits}"));
                    return index;
                }
                var maxLng = long.MaxValue.ToString();
                if (maxLng.Length + 1 < intDigits.Length + e)  //check overflow by length
                {
                    serros.Add(new SyntaxErrorData(index, expDigits.Length, $"Exponential {expDigits} is out of range"));
                    return index;
                }
                intDigits = intDigits + new string('0', e);
            }

            long longVal;

            if (hasLong) //if l suffix is found
            {
                if (!long.TryParse(intDigits, out longVal))
                {
                    serros.Add(new SyntaxErrorData(index, expDigits.Length, $"{intDigits} couldn't be parsed to 64bit integer"));
                    return index;
                }
                number = longVal;
                parseNode = new ParseNode(ParseNodeType.LiteralLong, index, i - index);
                return i;
            }

            if (int.TryParse(intDigits, out var intVal)) //try parsing as int
            {
                number = intVal;
                parseNode = new ParseNode(ParseNodeType.LiteralInteger, index, i - index);
                return i;

            }

            if (long.TryParse(intDigits, out longVal)) //try parsing as long
            {
                number = longVal;
                parseNode = new ParseNode(ParseNodeType.LiteralLong, index, i - index);
                return i;
            }

            return index; //all failed
        }

        static bool IsIdentfierFirstChar(char ch)
        {
            return char.IsLetter(ch) || ch == '_';
        }
        static bool IsIdentfierOtherChar(char ch)
        {
            return char.IsLetterOrDigit(ch) || ch == '_';
        }
        static int GetSpaceLessString(String exp, int index, out String text, out ParseNode parseNode)
        {
            parseNode = null;
            text = null;
            if (index >= exp.Length)
                return index;
            var i = index;

            if (i >= exp.Length || isCharWhiteSpace(exp[i]))
                return index;
            i++;
            while (i < exp.Length && !isCharWhiteSpace(exp[i]))
                i++;

            text = exp.Substring(index, i - index);
            parseNode = new ParseNode(ParseNodeType.Identifier, index, i - index);
            return i;
        }
        static int GetIdentifier(String exp, int index, out String iden, out String idenLower, out ParseNode parseNode)
        {
            parseNode = null;
            iden = null;
            idenLower = null;
            if (index >= exp.Length)
                return index;
            var i = index;
            if (!IsIdentfierFirstChar(exp[i++]))
                return index;
            while (i < exp.Length && IsIdentfierOtherChar(exp[i]))
            {
                i++;
            }
            iden = exp.Substring(index, i - index);
            idenLower = iden.ToLower();
            if (s_KeyWords.Contains(idenLower))
                return index;
            parseNode = new ParseNode(ParseNodeType.Identifier, index, i - index);
            return i;
        }
        static int GetIdentifierList(String exp, int index, out List<String> idenList, out ParseNode parseNode)
        {
            parseNode = null;
            idenList = null;
            int i = SkipSpace(exp, index);
            //get open brace
            if (i >= exp.Length || exp[i++] != '(')
                return index;

            idenList = new List<string>();
            var parseNodes = new List<ParseNode>();
            //get first identifier
            i = SkipSpace(exp, i);
            int i2 = GetIdentifier(exp, i, out var iden, out var idenLower, out var nodeIden);
            if (i2 > i)
            {
                parseNodes.Add(nodeIden);
                idenList.Add(iden);
                i = i2;

                //get additional identifiers sperated by commas
                i = SkipSpace(exp, i);
                while (i < exp.Length)
                {
                    if (exp[i] != ',')
                        break;
                    i++;
                    i = SkipSpace(exp, i);
                    i2 = GetIdentifier(exp, i, out iden, out idenLower, out nodeIden);
                    if (i2 == i)
                        return index;
                    parseNodes.Add(nodeIden);
                    idenList.Add(iden);
                    i = i2;
                    i = SkipSpace(exp, i);
                }
            }
            //get close brace
            if (i >= exp.Length || exp[i++] != ')')
                return index;
            parseNode = new ParseNode(ParseNodeType.IdentiferList, index, i - index, parseNodes);
            return i;
        }

        static int GetDoubleLetterOps(IFsDataProvider context, string exp, int index, out IFsFunction oper, out ParseNode parseNode)
        {
            parseNode = null;
            oper = null;
            if (index >= exp.Length - 1)
                return index;
            var ch1 = exp[index];
            var ch2 = exp[index + 1];

            foreach (var op in s_DoubleLetterOps)
                if (op[0] == ch1 && op[1] == ch2)
                {
                    var func = context.GetData(op);
                    if (func == null)
                        return index;
                    oper = (IFsFunction)func;
                    parseNode = new ParseNode(ParseNodeType.Operator, index, 2);
                    return index + 2;
                }
            return index;
        }
        static int GetSingleLetterOperator(IFsDataProvider context, string exp, int index, out IFsFunction oper, out ParseNode parseNode)
        {
            parseNode = null;
            oper = null;
            if (index >= exp.Length)
                return index;
            var ch = exp[index];

            foreach (var op in s_SingleLetterOps)
                if (op[0] == ch)
                {
                    var func = context.GetData(op);
                    if (func == null)
                        return index;
                    oper = (IFsFunction)func;
                    parseNode = new ParseNode(ParseNodeType.Operator, index, 1);
                    return index + 1;
                }
            return index;
        }
        static int GetOperator(IFsDataProvider infixFuncProvider, string exp, int index, out IFsFunction oper, out ParseNode parseNode)
        {
            parseNode = null;
            var i = GetIdentifier(exp, index, out var iden, out var idenLower, out var nodeIden);
            if (i > index)
            {
                oper = infixFuncProvider.GetData(iden) as IFsFunction;
                if (oper == null)/*|| oper.CallType != CallType.Infix)*/
                    return index;
                parseNode = nodeIden;
                return i;
            }

            i = GetDoubleLetterOps(infixFuncProvider, exp, index, out oper, out var nodeOper);
            if (i > index)
            {
                parseNode = nodeOper;
                return i;
            }
            i = GetSingleLetterOperator(infixFuncProvider, exp, index, out oper, out nodeOper);
            if (i > index)
            {
                parseNode = nodeOper;
                return i;
            }
            return index;
        }
        static int GetLambdaExpression(IFsDataProvider context, String exp, int index, out ExpressionFunction func, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            func = null;

            var i = GetIdentifierList(exp, index, out var parms, out var nodesParams);
            if (i == index)
                return index;

            i = SkipSpace(exp, i);
            if (i >= exp.Length - 1) // we need two characters
                return index;
            var i2 = GetLiteralMatch(exp, i, "=>");
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "'=>' expected"));
                return index;
            }
            i += 2;
            i = SkipSpace(exp, i);
            var parmsSet = new HashSet<string>();
            foreach (var p in parms)
            {
                parmsSet.Add(p);
            }
            i2 = GetExpression(context, exp, i, out var defination, out var nodeDefination, serrors);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "defination of lambda expression expected"));
                return index;
            }

            func = new ExpressionFunction(parms.ToArray(), defination);
            i = i2;
            parseNode = new ParseNode(ParseNodeType.LambdaExpression, index, i - index, new[] { nodesParams, nodeDefination });
            return i;

        }
        static int GetExpInParenthesis(IFsDataProvider infixFuncProvider, String exp, int index, out ExpressionBlock expression, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            expression = null;
            var i = index;
            i = SkipSpace(exp, i);
            var i2 = GetLiteralMatch(exp, i, "(");
            if (i == i2)
                return index;
            i = i2;

            i = SkipSpace(exp, i);
            i2 = GetExpression(infixFuncProvider, exp, i, out expression, out var nodeExpression, serrors);
            if (i2 == i)
                expression = null;
            else
                i = i2;
            i = SkipSpace(exp, i);
            i2 = GetLiteralMatch(exp, i, ")");
            if (i == i2)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "')' expected"));
                return index;
            }
            i = i2;
            if (expression == null)
                expression = new NullExpressionBlock();
            parseNode = new ParseNode(ParseNodeType.ExpressionInBrace, index, i - index, new[] { nodeExpression });
            return i;
        }

        // Deprecated: This method uses the IndexOf method which can be slow for large strings or when searching for multiple keywords.
        // It is recommended to use the GetLiteralMatch method instead.
        [Obsolete("Use GetLiteralMatch instead.")]
        static int GetLiteralMatch_IndexOf(String exp, int index, params string[] keyWord)
        {
            foreach (var k in keyWord)
            {
                if (exp.IndexOf(k, index, StringComparison.CurrentCultureIgnoreCase) == index)
                {
                    return index + k.Length;
                }
            }
            return index;
        }

        /// <summary>
        /// Checks if any provided keywords are present in the input string, starting from the specified index.
        /// </summary>
        /// <param name="exp">The input string to search for keywords.</param>
        /// <param name="index">The starting index to search for keywords.</param>
        /// <param name="keyWord">Keywords to search for within the input string.</param>
        /// <returns>The index after the end of the matched keyword if found, or the same `index` if no match is found.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the input expression is null.</exception>
        /// <remarks>
        /// This method uses a nested for loop for character comparison, providing better performance.
        /// </remarks>
        static public int GetLiteralMatch(string exp, int index, params string[] keyWord)
        {
            if (exp == null)
            {
                throw new ArgumentNullException(nameof(exp), "The input expression cannot be null.");
            }

            foreach (var k in keyWord)
            {
                bool matchFound = true;
                if (index + k.Length <= exp.Length)
                {
                    for (int i = 0; i < k.Length; i++)
                    {
                        if (char.ToLowerInvariant(exp[index + i]) != char.ToLowerInvariant(k[i]))
                        {
                            matchFound = false;
                            break;
                        }
                    }

                    if (matchFound)
                    {
                        return index + k.Length;
                    }
                }
            }
            return index;
        }
        

        static int GetReturnDefinition(IFsDataProvider context, String exp, int index, out ExpressionBlock retExp, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            retExp = null;
            var i = GetLiteralMatch(exp, index, KW_RETURN);
            if (i == index)
                return index;
            var nodeReturn = new ParseNode(ParseNodeType.KeyWord, index, i - index);
            i = SkipSpace(exp, i);
            var i2 = GetExpression(context, exp, i, out var expBlock, out var nodeExpBlock, serrors);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "return expression expected"));
                return index;
            }
            i = i2;
            retExp = expBlock;
            retExp.Pos = index;
            retExp.Length = i - index;
            parseNode = new ParseNode(ParseNodeType.ExpressionInBrace, index, i - index,
                new[] { nodeReturn, nodeExpBlock });

            return i;
        }
        static int GetSimpleString(string exp, int index, out String str, out ParseNode pareNode, List<SyntaxErrorData> serrors)
        {
            var i = GetSimpleString(exp, "\"", index, out str, out pareNode, serrors);
            if (i > index)
                return i;
            return GetSimpleString(exp, "'", index, out str, out pareNode, serrors);
        }
        static int GetSimpleString(string exp, string delimator, int index, out String str, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            str = null;
            var i = GetLiteralMatch(exp, index, delimator);
            if (i == index)
                return index;
            int i2;
            var sb = new StringBuilder();
            while (true)
            {
                i2 = GetLiteralMatch(exp, i, @"\n");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append('\n');
                    continue;
                }
                i2 = GetLiteralMatch(exp, i, @"\t");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append('\t');
                    continue;
                }
                i2 = GetLiteralMatch(exp, i, @"\\");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append('\\');
                    continue;
                }

                i2 = GetLiteralMatch(exp, i, $@"\{delimator}");
                if (i2 > i)
                {
                    sb.Append(delimator);
                    i = i2;
                }
                if (i >= exp.Length || GetLiteralMatch(exp, i, delimator) > i)
                    break;
                sb.Append(exp[i]);
                i++;
            }
            i2 = GetLiteralMatch(exp, i, delimator);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, $"'{delimator}' expected"));
                return index;
            }
            i = i2;
            str = sb.ToString();
            parseNode = new ParseNode(ParseNodeType.LiteralString, index, i - index);
            return i;

        }

        static int GetStringTemplate(IFsDataProvider provider, string exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {

            var i = GetStringTemplate(provider, "\"", exp, index, out prog, out parseNode, serrors);
            if (i > index)
                return i;
            return GetStringTemplate(provider, "'", exp, index, out prog, out parseNode, serrors);
        }

        static int GetStringTemplate(IFsDataProvider provider,String delimator,string exp, int index, out ExpressionBlock prog,out ParseNode parseNode,List<SyntaxErrorData> serrors)
        {

            

            parseNode = null;
            prog = null;
            var parts = new List<ExpressionBlock>();
            var nodeParts = new List<ParseNode>();
            

            var i = GetLiteralMatch(exp, index, $"f{delimator}");
            if (i == index)
                return index;
            var lastIndex = i;
            var sb = new StringBuilder();
            int i2;
            while (true)
            {
                i2 = GetLiteralMatch(exp, i, @"\\");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append('\\');
                    continue;
                }
                i2 = GetLiteralMatch(exp, i, @"\n");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append('\n');
                    continue;
                }
                i2 = GetLiteralMatch(exp, i, @"\t");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append('\t');
                    continue;
                }

                i2 = GetLiteralMatch(exp, i, $@"\{delimator}");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append(delimator);
                    continue;
                }
                i2 = GetLiteralMatch(exp, i, @"\{");
                if (i2 > i)
                {
                    i = i2;
                    sb.Append("{");
                    continue;
                }
                i2 = GetLiteralMatch(exp, i, "{");
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
                    continue;
                }
                if (i >= exp.Length || GetLiteralMatch(exp, i, delimator) > i)
                    break;
                sb.Append(exp[i]);
                i++;
            }

            if (i > lastIndex)
            {
                if (sb.Length > 0)
                {
                    parts.Add(new LiteralBlock(sb.ToString()));
                    nodeParts.Add(new ParseNode(ParseNodeType.LiteralString, lastIndex, i - lastIndex));
                    sb = new StringBuilder();
                }

                nodeParts.Add(new ParseNode(ParseNodeType.LiteralString, lastIndex, i - lastIndex));
            }

            i2 = GetLiteralMatch(exp, i, delimator);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, $"'{delimator}' expected"));
                return index;
            }
            i = i2;

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
                    Function = new LiteralBlock(provider.GetData("+")),
                    Parameters = parts.ToArray()

                };
                parseNode = new ParseNode(ParseNodeType.StringTemplate, index, i - index, nodeParts);
            }

            return i;

        }
        static int GetKeyValuePair(IFsDataProvider context, string exp, int index, out KvcExpression.KeyValueExpression keyValue, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            keyValue = null;
            string name;
            var i = GetSimpleString(exp, index, out name, out var nodeNeme, new List<SyntaxErrorData>());
            if (i == index)
            {
                i = GetIdentifier(exp, index, out name, out var nameLower, out nodeNeme);
                if (i == index)
                    return index;
            }
            i = SkipSpace(exp, i);

            var i2 = GetLiteralMatch(exp, i, ":");
            if (i2 == i)
                return index;

            i = i2;

            i = SkipSpace(exp, i);
            i2 = GetExpression(context, exp, i, out var expBlock, out var nodeExpBlock, serrors);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "value expression expected"));
                return index;
            }

            i = i2;
            i = SkipSpace(exp, i);
            keyValue = new KvcExpression.KeyValueExpression
            {
                Key = name,
                ValueExpression = expBlock
            };
            nodeNeme.NodeType = ParseNodeType.Key;
            parseNode = new ParseNode(ParseNodeType.KeyValuePair, index, i - index, new[] { nodeNeme, nodeExpBlock });
            return i;
        }
        static int GetKvcItem(IFsDataProvider context, String exp, int index, out KvcExpression.KeyValueExpression item, out ParseNode parseNode)
        {
            item = null;
            var e1 = new List<SyntaxErrorData>();
            var i = GetKeyValuePair(context, exp, index, out item, out parseNode, e1);
            if (i > index)
                return i;

            var e2 = new List<SyntaxErrorData>();
            i = GetReturnDefinition(context, exp, index, out var retExp, out var nodeRetExp, e2);
            if (i > index)
            {
                item = new KvcExpression.KeyValueExpression
                {
                    Key = null,
                    ValueExpression = retExp
                };
                parseNode = nodeRetExp;
                return i;
            }

            i = GetIdentifier(exp, index, out var iden, out var idenLower, out var nodeIden);
            if (i > index)
            {
                item = new KvcExpression.KeyValueExpression
                {
                    Key = iden,
                    KeyLower = idenLower,
                    ValueExpression = new ReferenceBlock(iden, idenLower)
                    {
                        Pos = index,
                        Length = i - index
                    }
                };
                parseNode = nodeIden;
                return i;
            }
            var e3 = new List<SyntaxErrorData>();
            i = GetSimpleString(exp, index, out iden, out nodeIden, e3);
            if (i > index)
            {
                item = new KvcExpression.KeyValueExpression
                {
                    Key = iden,
                    KeyLower = idenLower,
                    ValueExpression = new ReferenceBlock(iden, iden.ToLower())
                    {
                        Pos = index,
                        Length = i - index
                    }
                };
                parseNode = nodeIden;
                return i;
            }

            return index;
        }
        static int GetKvcExpression(IFsDataProvider context, String exp, int index, out KvcExpression kvcExpr, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            kvcExpr = null;
            var i = SkipSpace(exp, index);
            if (i >= exp.Length || exp[i++] != '{')
                return index;//we didn't find '{'

            var kvs = new List<KvcExpression.KeyValueExpression>();
            i = SkipSpace(exp, i);
            var nodeItems = new List<ParseNode>();
            var i2 = GetKvcItem(context, exp, i, out var firstItem, out var nodeFirstItem);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "return expression expected"));
                return index;
            }

            kvs.Add(firstItem);
            nodeItems.Add(nodeFirstItem);
            i = i2;
            do
            {
                i = SkipSpace(exp, i);
                i2 = GetLiteralMatch(exp, i, ",", ";");
                if (i2 == i)
                    break;
                i = i2;

                i = SkipSpace(exp, i);
                i2 = GetKvcItem(context, exp, i, out var otherItem, out var nodeOtherItem);
                if (i2 == i)
                    break;
                kvs.Add(otherItem);
                nodeItems.Add(nodeOtherItem);
                i = i2;

            } while (true);

            i = SkipSpace(exp, i);
            if (i >= exp.Length || exp[i++] != '}')
            {
                serrors.Add(new SyntaxErrorData(i, 0, "'}' expected"));
                return index;
            }
            kvcExpr = new KvcExpression();
            var error = kvcExpr.SetKeyValues(kvs.ToArray());
            if (error != null)
            {
                serrors.Add(new SyntaxErrorData(index, i - index, error));
                return index;
            }
            parseNode = new ParseNode(ParseNodeType.KeyValueCollection, index, i - index, nodeItems);
            return i;
        }
        static int GetSpaceSepratedListExpression(IFsDataProvider context, String exp, int index, out ListExpression listExpr, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            listExpr = null;
            var i = SkipSpace(exp, index);

            var listItems = new List<ExpressionBlock>();
            var nodeListItems = new List<ParseNode>();
            var i2 = GetExpression(context, exp, i, out var firstItem, out var nodeFirstItem, serrors);
            if (i2 > i)
            {
                listItems.Add(firstItem);
                nodeListItems.Add(nodeFirstItem);
                i = i2;
                do
                {

                    i2 = GetLiteralMatch(exp, i, " ");
                    if (i2 == i)
                        break;
                    i = i2;
                    i = SkipSpace(exp, i);
                    i2 = GetExpression(context, exp, i, out var otherItem, out var nodeOtherItem, serrors);
                    if (i2 == i)
                        break;
                    listItems.Add(otherItem);
                    nodeListItems.Add(nodeOtherItem);
                    i = i2;

                } while (true);
            }

            listExpr = new ListExpression { ValueExpressions = listItems.ToArray() };
            parseNode = new ParseNode(ParseNodeType.List, index, i - index, nodeListItems);
            return i;
        }


        static int GetSpaceSepratedStringListExpression(IFsDataProvider context, String exp, int index, out List<string> stringList, out ParseNode parseNode, List<SyntaxErrorData> serrors)
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

        static int GetListExpression(IFsDataProvider context, String exp, int index, out ListExpression listExpr, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            listExpr = null;
            var i = SkipSpace(exp, index);
            var i2 = GetLiteralMatch(exp, i, "[");
            if (i2 == i)
                return index;//we didn't find '['
            i = i2;

            var listItems = new List<ExpressionBlock>();
            var nodeListItems = new List<ParseNode>();
            i = SkipSpace(exp, i);
            i2 = GetExpression(context, exp, i, out var firstItem, out var nodeFirstItem, serrors);
            if (i2 > i)
            {
                listItems.Add(firstItem);
                nodeListItems.Add(nodeFirstItem);
                i = i2;
                do
                {
                    i = SkipSpace(exp, i);
                    i2 = GetLiteralMatch(exp, i, ",");
                    if (i2 == i)
                        break;
                    i = i2;

                    i = SkipSpace(exp, i);
                    i2 = GetExpression(context, exp, i, out var otherItem, out var nodeOtherItem, serrors);
                    if (i2 == i)
                        break;
                    listItems.Add(otherItem);
                    nodeListItems.Add(nodeOtherItem);
                    i = i2;

                } while (true);
            }
            i = SkipSpace(exp, i);
            i2 = GetLiteralMatch(exp, i, "]");
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "']' expected"));
                return index;
            }
            i = i2;
            listExpr = new ListExpression { ValueExpressions = listItems.ToArray() };
            parseNode = new ParseNode(ParseNodeType.List, index, i - index, nodeListItems);
            return i;
        }
        static int GetCommentBlock(String exp, int index, out ParseNode parseNode)
        {
            parseNode = null;
            var i = GetLiteralMatch(exp, index, "//");
            if (i == index)
                return index;
            var i2 = exp.IndexOf("\n", i);
            if (i2 == -1)
                i = exp.Length;
            else
                i = i2 + 1;
            parseNode = new ParseNode(ParseNodeType.Comment, index, i - index);
            return i;
        }
        static int GetCaseExpression(IFsDataProvider context, String exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            prog = null;
            parseNode = null;
            var i = index;
            var i2 = GetLiteralMatch(exp,i, KW_CASE);
            if(i2==i) 
                return index;
            i = SkipSpace(exp, i2);
            var pars = new List<ExpressionBlock>();
            var childNodes = new List<ParseNode>();
            do
            {
                if (pars.Count == 0)
                {

                    i2 = GetExpression(context, exp, i, out var part1, out var part1Node, serrors);
                    if (i2 == i)
                    {
                        serrors.Add(new SyntaxErrorData(i, 1, "Case condition expected"));
                        return index;
                    }
                    pars.Add(part1);
                    childNodes.Add(part1Node);
                    i = SkipSpace(exp, i2);
                }
                else
                {
                    i2 = GetLiteralMatch(exp, i, ",", ";");
                    if (i2 == i)
                        break;
                    i = SkipSpace(exp, i2);
                    i2 = GetExpression(context, exp, i, out var part1, out var part1Node, serrors);
                    if (i2 == i)
                        break;
                    pars.Add(part1);
                    childNodes.Add(part1Node);
                    i = SkipSpace(exp, i2);
                }

                i2 = GetLiteralMatch(exp, i, ":");
                if(i2==i)
                {
                    break;
                }

                i = SkipSpace(exp, i2);
                i2 = GetExpression(context, exp, i, out var part2, out var part2Node, serrors);
                if(i2==i)
                {
                    serrors.Add(new SyntaxErrorData(i, 1, "Case value expected"));
                    return index;
                }
                pars.Add(part2);
                childNodes.Add(part2Node);
                i = SkipSpace(exp, i2);
            } while (true);
            prog = new FunctionCallExpression
            {
                Function = new LiteralBlock(context.GetData(KW_CASE)),
                Pos = index,
                Length = i - index,
                Parameters = pars.ToArray(),
            };
            parseNode = new ParseNode(ParseNodeType.Case, index, index - i);
            parseNode.Childs = childNodes;
            return i;
        }
        static int GetMemberAccess(IFsDataProvider context, ExpressionBlock source, String exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            var i2=GetMemberAccess(context,".",source,exp, index, out prog, out parseNode, serrors);
            if(i2==index)
                return GetMemberAccess(context, "?.", source, exp, index, out prog, out parseNode, serrors);
            return i2;
        }
        static int GetMemberAccess(IFsDataProvider context, string oper, ExpressionBlock source, String exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            prog = null;
            var i = SkipSpace(exp, index);
            var i2 = GetLiteralMatch(exp, i, oper);
            if(i2==i)
                return index;
            i = i2;
            i = SkipSpace(exp, i);
            i2 = GetIdentifier(exp, i, out var member, out var memberLower, out parseNode);
            if (i2 == i)
            {
                serrors.Add(new SyntaxErrorData(i, 0, "member identifier expected"));
                return index;
            }
            i = i2;
            prog = new FunctionCallExpression
            {
                Function = new LiteralBlock(context.GetData(oper)),
                Parameters = new ExpressionBlock[] { source, new LiteralBlock(member) },
                Pos = source.Pos,
                Length = i - source.Pos
            };
            return i;
        }
        static int GetFunctionCallParametersList(IFsDataProvider context, ExpressionBlock func, String exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            var i = GetFunctionCallParametersList(context, "(", ")", func, exp, index, out prog, out parseNode, serrors);
            if (i == index)
                return GetFunctionCallParametersList(context, "[", "]", func, exp, index, out prog, out parseNode, serrors);
            return i;
        }
        static int GetFunctionCallParametersList(IFsDataProvider context, String openBrance, String closeBrance, ExpressionBlock func, String exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            prog = null;

            //make sure we have open brace
            var i=SkipSpace(exp, index);
            var i2 = GetLiteralMatch(exp, i, openBrance);
            if (i==i2)
                return index;//we didn't find '('
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
                }
                while (true);
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

        static int GetOperand(IFsDataProvider parseContext, String exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            prog = null;
            var i = GetUnit(parseContext, exp, index, out var theUnit, out parseNode, serrors);
            if (i == index)
                return index;

            do
            {
                //lets see if this is part of a function call
                var i2 = GetFunctionCallParametersList(parseContext, theUnit, exp, i, out var funcCall, out var nodeParList, serrors);
                if (i2 > i)
                {
                    i = i2;
                    theUnit = funcCall;
                    parseNode = new ParseNode(ParseNodeType.FunctionCall, index, i - index, new[] { parseNode, nodeParList });
                    continue;
                }
                i2 = GetMemberAccess(parseContext, theUnit, exp, i, out var memberAccess, out var nodeMemberAccess, serrors);
                if (i2 > i)
                {
                    i = i2;
                    theUnit = memberAccess;
                    parseNode = new ParseNode(ParseNodeType.MemberAccess, index, i - index, new[] { parseNode, nodeMemberAccess });
                    continue;
                }
                i2 = GetKvcExpression(parseContext, exp, i, out var kvc, out var nodeKvc, serrors);
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
            }
            while (true);
        }
        static int GetUnit(IFsDataProvider provider, String exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            ParseNode nodeUnit;
            parseNode = null;
            prog = null;
            int i;

            //get string
            i = GetStringTemplate(provider, exp, index, out var template,out nodeUnit,serrors);
            if (i > index)
            {
                parseNode = nodeUnit;
                prog = template;
                prog.Pos = index;
                prog.Length = i - index;
                return i;

            }

            //get string 
            i = GetSimpleString(exp, index, out var str, out nodeUnit, serrors);
            if (i > index)
            {
                parseNode = nodeUnit;
                prog = new LiteralBlock(str);
                prog.Pos = index;
                prog.Length = i - index;
                return i;

            }

            //get number
            i = GetNumber(exp, index, out var numberVal, out nodeUnit, serrors);
            if (i > index)
            {
                parseNode = nodeUnit;
                prog = new LiteralBlock(numberVal);
                prog.Pos = index;
                prog.Length = i - index;
                return i;

            }

            //list expression
            i = GetListExpression(provider, exp, index, out var lst, out nodeUnit, serrors);
            if (i > index)
            {
                parseNode = nodeUnit;
                prog = lst;
                prog.Pos = index;
                prog.Length = i - index;
                return i;
            }


            //kvc expression
            i = GetKvcExpression(provider, exp, index, out var json, out nodeUnit, serrors);
            if (i > index)
            {
                parseNode = nodeUnit;
                prog = json;
                prog.Pos = index;
                prog.Length = i - index;
                return i;
            }
            
            i = GetCaseExpression(provider, exp, i, out var caseExp, out var caseNode, serrors);
            if (i > index)
            {
                parseNode = caseNode;
                prog = caseExp;
                prog.Pos = index;
                prog.Length = i - index;
                return i;
            }

            //expression function
            i = GetLambdaExpression(provider, exp, index, out var ef, out nodeUnit, serrors);
            if (i > index)
            {
                parseNode = nodeUnit;
                prog = new LiteralBlock(ef);
                prog.Pos = index;
                prog.Length = i - index;
                return i;
            }



            //null, true, false
            i = GetKeyWordLiteral(exp, index, out var kw, out nodeUnit);
            if (i > index)
            {
                parseNode = nodeUnit;
                prog = new LiteralBlock(kw);
                prog.Pos = index;
                prog.Length = i - index;
                return i;
            }

            //get identifier
            i = GetIdentifier(exp, index, out var ident, out var identLower, out nodeUnit);
            if (i > index)
            {
                parseNode = nodeUnit;
                prog = new ReferenceBlock(ident);
                prog.Pos = index;
                prog.Length = i - index;
                return i;
            }

            i = GetExpInParenthesis(provider, exp, index, out prog, out nodeUnit, serrors);
            if (i > index)
            {
                parseNode = nodeUnit;
                prog.Pos = index;
                prog.Length = i - index;
                return i;
            }
            return index;

        }
        class InfixFuncElement
        {
            public IFsFunction F;
            public int ParCount;
            public InfixFuncElement(IFsFunction F)
            {
                this.F = F;
                ParCount = 1;
            }
        }
        static int GetExpression(IFsDataProvider parseContext, String exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            prog = null;
            parseNode = null;
            Stack<ExpressionBlock> nodeStack = new Stack<ExpressionBlock>();
            Stack<InfixFuncElement> funcStack = new Stack<InfixFuncElement>();
            var parseNodes = new List<ParseNode>();
            var i = SkipSpace(exp, index);
            var i2 = GetOperand(parseContext, exp, i, out var op1, out var nodeOp1, serrors);
            if (i2 == i)
                return index;
            i = i2;
            parseNodes.Add(nodeOp1);
            nodeStack.Push(op1);
            do
            {
                i = SkipSpace(exp, i);
                i2 = GetOperator(parseContext, exp, i, out var oper, out var nodeOper);
                if (i2 > i)
                {
                    parseNodes.Add(nodeOper);
                    //if there is anything in the function stack
                    var merged = false;
                    if (funcStack.Count > 0)
                    {
                        var top = funcStack.Peek();
                        if (top.F == oper) //if the new function at the top of the stack is the same, just increment the parameter count
                        {
                            top.ParCount++;
                            merged = true;
                        }
                        else
                        {
                            while (top.F.Precidence <= oper.Precidence) //pop all fuctions that have lower or the same precidence as the new function
                            {
                                top.ParCount++; //increment the parameter count before poping the functions
                                //we will build an ealuation node using the poped out function and its parameters in the stack
                                var pars = new ExpressionBlock[top.ParCount];
                                for (int k = pars.Length - 1; k >= 0; k--)
                                {
                                    pars[k] = nodeStack.Pop();
                                }
                                var node = new FunctionCallExpression
                                {
                                    Function = new LiteralBlock(top.F),
                                    Parameters = pars,
                                };
                                nodeStack.Push(node); //
                                funcStack.Pop();
                                if (funcStack.Count == 0) //finish when funcstack is empty
                                    break;
                                top = funcStack.Peek(); //peek the next function
                            }
                        }

                    }
                    if (!merged)
                        funcStack.Push(new InfixFuncElement(oper)); //push the new operator to the function list
                    i = i2;
                    i = SkipSpace(exp, i);
                    i2 = GetOperand(parseContext, exp, i, out var op2, out var nodeOp2, serrors);
                    if (i2 == i)
                    {
                        serrors.Add(new SyntaxErrorData(i, 0, "right side operand expected"));
                        return index;
                    }
                    parseNodes.Add(nodeOp2);
                    nodeStack.Push(op2);
                    i = i2;
                }
                else
                    break;
            } while (true);
            while (funcStack.Count > 0) //flush all remaining functions in the function stack
            {
                var top = funcStack.Peek();
                top.ParCount++;
                var pars = new ExpressionBlock[top.ParCount];
                for (int k = pars.Length - 1; k >= 0; k--)
                {
                    pars[k] = nodeStack.Pop();
                }
                var node = new FunctionCallExpression
                {
                    Function = new LiteralBlock(top.F),
                    Parameters = pars,

                };
                nodeStack.Push(node);
                funcStack.Pop();
            }
            if (nodeStack.Count == 0)
                throw new Exception("BUG: node stack cleared unexpectedly");
            if (nodeStack.Count > 1)
                throw new Exception("BUG: more than one element still remaining in node stack");
            prog = nodeStack.Peek();
            prog.Pos = index;
            prog.Length = i - index;
            parseNode = new ParseNode(ParseNodeType.InfixExpression, index, i - index, parseNodes);
            return i;
        }
        public static int GetFSTemplate(IFsDataProvider provider, string exp, int index, out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
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
                if (i2 >i)
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
                    Function = new LiteralBlock(provider.GetData(TemplateMergeMergeFunction.SYMBOL)),
                    Parameters = parts.ToArray()

                };
                parseNode = new ParseNode(ParseNodeType.StringTemplate, index, i - index, nodeParts);
            }

            return i;

        }
        public static ExpressionBlock Parse(IFsDataProvider context, String exp, List<SyntaxErrorData> serrors)
        {
            return Parse(context, exp, out var node, serrors);
        }
        public static List<string> ParseSpaceSepratedList(IFsDataProvider context, String exp, List<SyntaxErrorData> serrors)
        {
            if (DefaultFsDataProvider.Trace)
                DefaultFsDataProvider.WriteTraceLine($"Parsing {exp}");
            var i = GetSpaceSepratedStringListExpression(context, exp, 0, out var prog, out var parseNode, serrors);
            return prog;
        }
        public static ExpressionBlock ParseFsTemplate(IFsDataProvider context, String exp, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            var i = GetFSTemplate(context, exp, 0,out var block, out parseNode, serrors);
            return block;
        }
        public static ExpressionBlock Parse(IFsDataProvider context, String exp, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            if (DefaultFsDataProvider.Trace)
                DefaultFsDataProvider.WriteTraceLine($"Parsing {exp}");
            var i = GetExpression(context, exp, 0, out var prog, out parseNode, serrors);
            return prog;
        }
        public static ExpressionBlock ParseFsTemplate(IFsDataProvider context, String exp, List<SyntaxErrorData> serrors)
        {
            return ParseFsTemplate(context, exp, out var node, serrors);
        }
    }
}
