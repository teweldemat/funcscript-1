namespace FunscScript.Core
{
    public partial class FunscScriptParser
    {
        static int GetInfixExpression(IFsDataProvider parseContext, String exp, int index, out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            var i = GetInfixExpressionSingleLevel(parseContext, s_operatorSymols.Length - 1, s_operatorSymols[^1], exp,
                index, out prog,
                out parseNode, serrors);
            return i;
        }
    }
}
