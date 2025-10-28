using FuncScript.Block;

namespace FuncScript.Core
{
    public partial class FuncScriptParser
    {
        static int GetMemberAccess(IFsDataProvider context, ExpressionBlock source, String exp, int index,
            out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            var i2 = GetMemberAccess(context, ".", source, exp, index, out prog, out parseNode, serrors);
            if (i2 == index)
                return GetMemberAccess(context, "?.", source, exp, index, out prog, out parseNode, serrors);
            return i2;
        }

        static int GetMemberAccess(IFsDataProvider context, string oper, ExpressionBlock source, String exp, int index,
            out ExpressionBlock prog, out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            parseNode = null;
            prog = null;
            var i = SkipSpace(exp, index);
            var i2 = GetLiteralMatch(exp, i, oper);
            if (i2 == i)
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
                Function = new LiteralBlock(context.Get(oper)),
                Parameters = new ExpressionBlock[] { source, new LiteralBlock(member) },
                Pos = source.Pos,
                Length = i - source.Pos
            };
            return i;
        }
    }
}
