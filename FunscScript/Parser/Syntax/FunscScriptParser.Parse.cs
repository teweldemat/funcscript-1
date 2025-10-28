namespace FunscScript.Core
{
    public partial class FunscScriptParser
    {
        public static ExpressionBlock Parse(IFsDataProvider context, String exp, List<SyntaxErrorData> serrors)
        {
            return Parse(context, exp, out var node, serrors);
        }


        public static ExpressionBlock Parse(IFsDataProvider context, String exp, out ParseNode parseNode,
            List<SyntaxErrorData> serrors)
        {
            var i = GetRootExpression(context, exp, 0, out var prog, out parseNode, serrors);
            return prog;
        }


    }
}
