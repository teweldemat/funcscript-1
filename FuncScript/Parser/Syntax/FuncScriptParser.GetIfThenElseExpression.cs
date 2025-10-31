using System.Collections.Generic;
using FuncScript.Block;

namespace FuncScript.Core
{
    public partial class FuncScriptParser
    {
        static int GetIfThenElseExpression(IFsDataProvider context, string exp, int index, out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            prog = null;
            parseNode = null;

            if (index >= exp.Length)
                return index;

            var afterIf = GetLiteralMatch(exp, index, "if");
            if (afterIf == index)
                return index;

            if (afterIf < exp.Length && IsIdentfierOtherChar(exp[afterIf]))
                return index;

            if (afterIf < exp.Length && !isCharWhiteSpace(exp[afterIf]))
                return index;

            var conditionStart = SkipSpace(exp, afterIf);
            if (conditionStart >= exp.Length)
                return index;

            if (!TrySplitIfThenElseSegments(exp, conditionStart, out var conditionSegment, out var trueSegment,
                    out var falseStart, out var thenIndex, out var elseIndex))
            {
                return index;
            }

            // parse condition segment
            var conditionTextLength = conditionSegment.end - conditionSegment.start;
            if (conditionTextLength <= 0)
                return index;

            var conditionErrors = new List<SyntaxErrorData>();
            var conditionExpr = Parse(context, exp.Substring(conditionSegment.start, conditionTextLength),
                out var conditionNode, conditionErrors);
            if (conditionExpr == null || conditionErrors.Count > 0)
            {
                AddErrorsWithOffset(serrors, conditionErrors, conditionSegment.start);
                return index;
            }
            OffsetParseNode(conditionNode, conditionSegment.start);
            conditionExpr.Pos = conditionSegment.start;
            conditionExpr.Length = conditionTextLength;

            // parse true segment
            var trueTextLength = trueSegment.end - trueSegment.start;
            if (trueTextLength <= 0)
                return index;

            var trueErrors = new List<SyntaxErrorData>();
            var trueExpr = Parse(context, exp.Substring(trueSegment.start, trueTextLength), out var trueNode,
                trueErrors);
            if (trueExpr == null || trueErrors.Count > 0)
            {
                AddErrorsWithOffset(serrors, trueErrors, trueSegment.start);
                return index;
            }
            OffsetParseNode(trueNode, trueSegment.start);
            trueExpr.Pos = trueSegment.start;
            trueExpr.Length = trueTextLength;

            // parse false segment using main expression parser to determine remaining length
            var falseErrors = new List<SyntaxErrorData>();
            var falseConsumed = GetExpression(context, exp, falseStart, out var falseExpr, out var falseNode,
                falseErrors);
            if (falseConsumed == falseStart)
            {
                AddErrorsWithOffset(serrors, falseErrors, 0);
                return index;
            }
            if (falseErrors.Count > 0)
            {
                AddErrorsWithOffset(serrors, falseErrors, 0);
                return index;
            }

            falseExpr.Pos = falseStart;
            falseExpr.Length = falseConsumed - falseStart;

            var functionBlock = new ReferenceBlock(exp.Substring(index, afterIf - index))
            {
                Pos = index,
                Length = afterIf - index
            };

            prog = new FunctionCallExpression
            {
                Function = functionBlock,
                Parameters = new[] { conditionExpr, trueExpr, falseExpr },
                Pos = index,
                Length = falseConsumed - index
            };

            var identifierNode = new ParseNode(ParseNodeType.Identifier, index, afterIf - index);

            var parameterChildren = new List<ParseNode>();
            if (conditionNode != null)
                parameterChildren.Add(conditionNode);
            if (trueNode != null)
                parameterChildren.Add(trueNode);
            if (falseNode != null)
                parameterChildren.Add(falseNode);

            var paramsStart = conditionExpr.Pos;
            var paramsEnd = falseExpr.Pos + falseExpr.Length;
            var parametersChildren = new List<ParseNode>();
            if (conditionNode != null)
                parametersChildren.Add(conditionNode);

            parametersChildren.Add(new ParseNode(ParseNodeType.KeyWord, thenIndex, 4));

            if (trueNode != null)
                parametersChildren.Add(trueNode);

            parametersChildren.Add(new ParseNode(ParseNodeType.KeyWord, elseIndex, 4));

            if (falseNode != null)
                parametersChildren.Add(falseNode);

            var parametersNode = new ParseNode(ParseNodeType.FunctionParameterList, paramsStart,
                paramsEnd - paramsStart, parametersChildren);

            parseNode = new ParseNode(ParseNodeType.FunctionCall, index, falseConsumed - index,
                new[] { identifierNode, parametersNode });

            return falseConsumed;
        }

        private static bool TrySplitIfThenElseSegments(string exp, int conditionStart,
            out (int start, int end) conditionSegment, out (int start, int end) trueSegment, out int falseStart,
            out int thenIndex, out int elseIndex)
        {
            conditionSegment = default;
            trueSegment = default;
            falseStart = -1;
            thenIndex = -1;
            elseIndex = -1;

            thenIndex = FindKeywordOutsideExpressions(exp, conditionStart, "then");
            if (thenIndex < 0)
                return false;

            var conditionEnd = TrimEndExclusive(exp, conditionStart, thenIndex);
            if (conditionEnd <= conditionStart)
                return false;

            var trueStart = SkipSpace(exp, thenIndex + 4);
            if (trueStart >= exp.Length)
                return false;

            elseIndex = FindElseOutsideExpressions(exp, trueStart);
            if (elseIndex < 0)
                return false;

            var trueEnd = TrimEndExclusive(exp, trueStart, elseIndex);
            if (trueEnd <= trueStart)
                return false;

            falseStart = SkipSpace(exp, elseIndex + 4);
            if (falseStart > exp.Length)
                return false;

            conditionSegment = (conditionStart, conditionEnd);
            trueSegment = (trueStart, trueEnd);
            return true;
        }

        private static int FindKeywordOutsideExpressions(string exp, int startIndex, string keyword)
        {
            int depthParen = 0;
            int depthBrace = 0;
            int depthBracket = 0;
            bool inString = false;
            char stringDelimiter = '\0';

            for (var i = startIndex; i < exp.Length; i++)
            {
                var ch = exp[i];

                if (inString)
                {
                    if (ch == '\\' && stringDelimiter == '"' && i + 1 < exp.Length)
                    {
                        i++;
                        continue;
                    }

                    if (ch == stringDelimiter)
                        inString = false;
                    continue;
                }

                if (ch == '"' || ch == '\'')
                {
                    inString = true;
                    stringDelimiter = ch;
                    continue;
                }

                switch (ch)
                {
                    case '(':
                        depthParen++;
                        continue;
                    case ')':
                        if (depthParen > 0)
                            depthParen--;
                        continue;
                    case '[':
                        depthBracket++;
                        continue;
                    case ']':
                        if (depthBracket > 0)
                            depthBracket--;
                        continue;
                    case '{':
                        depthBrace++;
                        continue;
                    case '}':
                        if (depthBrace > 0)
                            depthBrace--;
                        continue;
                }

                if (ch == '/' && i + 1 < exp.Length && exp[i + 1] == '/')
                {
                    var newline = exp.IndexOf('\n', i + 2);
                    if (newline == -1)
                        return -1;
                    i = newline;
                    continue;
                }

                if (depthParen == 0 && depthBrace == 0 && depthBracket == 0)
                {
                    var matchLength = MatchKeywordLength(exp, i, keyword);
                    if (matchLength > 0)
                        return i;
                    if (matchLength < 0)
                    {
                        i = -matchLength - 1;
                        continue;
                    }
                }
            }

            return -1;
        }

        private static int FindElseOutsideExpressions(string exp, int startIndex)
        {
            int depthParen = 0;
            int depthBrace = 0;
            int depthBracket = 0;
            bool inString = false;
            char stringDelimiter = '\0';
            int nestedIfDepth = 0;

            for (var i = startIndex; i < exp.Length; i++)
            {
                var ch = exp[i];

                if (inString)
                {
                    if (ch == '\\' && stringDelimiter == '"' && i + 1 < exp.Length)
                    {
                        i++;
                        continue;
                    }

                    if (ch == stringDelimiter)
                        inString = false;
                    continue;
                }

                if (ch == '"' || ch == '\'')
                {
                    inString = true;
                    stringDelimiter = ch;
                    continue;
                }

                switch (ch)
                {
                    case '(':
                        depthParen++;
                        continue;
                    case ')':
                        if (depthParen > 0)
                            depthParen--;
                        continue;
                    case '[':
                        depthBracket++;
                        continue;
                    case ']':
                        if (depthBracket > 0)
                            depthBracket--;
                        continue;
                    case '{':
                        depthBrace++;
                        continue;
                    case '}':
                        if (depthBrace > 0)
                            depthBrace--;
                        continue;
                }

                if (ch == '/' && i + 1 < exp.Length && exp[i + 1] == '/')
                {
                    var newline = exp.IndexOf('\n', i + 2);
                    if (newline == -1)
                        return -1;
                    i = newline;
                    continue;
                }

                if (depthParen == 0 && depthBrace == 0 && depthBracket == 0)
                {
                    var ifLength = MatchKeywordLength(exp, i, "if");
                    if (ifLength > 0)
                    {
                        nestedIfDepth++;
                        i += ifLength;
                        continue;
                    }
                    if (ifLength < 0)
                    {
                        i = -ifLength - 1;
                        continue;
                    }

                    var elseLength = MatchKeywordLength(exp, i, "else");
                    if (elseLength > 0)
                    {
                        if (nestedIfDepth == 0)
                            return i;
                        nestedIfDepth--;
                        i += elseLength;
                        continue;
                    }
                    if (elseLength < 0)
                    {
                        i = -elseLength - 1;
                        continue;
                    }
                }
            }

            return -1;
        }

        private static int TrimEndExclusive(string exp, int start, int end)
        {
            var result = end;
            while (result > start && isCharWhiteSpace(exp[result - 1]))
                result--;
            return result;
        }

        private static void OffsetParseNode(ParseNode node, int offset)
        {
            if (node == null)
                return;

            node.Pos += offset;
            if (node.Childs == null)
                return;
            foreach (var child in node.Childs)
            {
                OffsetParseNode(child, offset);
            }
        }

        private static void AddErrorsWithOffset(List<SyntaxErrorData> target, List<SyntaxErrorData> source, int offset)
        {
            foreach (var error in source)
            {
                target.Add(new SyntaxErrorData(error.Loc + offset, error.Length, error.Message));
            }
        }

        private static int MatchKeywordLength(string exp, int index, string keyword)
        {
            var matchIndex = GetLiteralMatch(exp, index, keyword);
            if (matchIndex > index)
            {
                var beforeChar = index > 0 ? exp[index - 1] : '\0';
                var afterChar = matchIndex < exp.Length ? exp[matchIndex] : '\0';
                if ((beforeChar == '\0' || isCharWhiteSpace(beforeChar) || !IsIdentfierOtherChar(beforeChar)) &&
                    (afterChar == '\0' || isCharWhiteSpace(afterChar) || !IsIdentfierOtherChar(afterChar)))
                {
                    return matchIndex - index;
                }
                return -(matchIndex);
            }

            return 0;
        }
    }
}
