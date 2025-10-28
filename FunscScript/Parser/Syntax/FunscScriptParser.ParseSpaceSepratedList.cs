namespace FunscScript.Core
{
    public partial class FunscScriptParser
    {
        public static List<string> ParseSpaceSepratedList(IFsDataProvider context, String exp,
            List<SyntaxErrorData> serrors)
        {
            var i = GetSpaceSepratedStringListExpression(context, exp, 0, out var prog, out var parseNode, serrors);
            return prog;
        }
    }
}
