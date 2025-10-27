using FuncScript.Core;

namespace FuncScript.Block
{
    public class NullExpressionBlock : ExpressionBlock
    {
        public override object Evaluate(IFsDataProvider provider)
        {
            return null;
        }
        public override IList<ExpressionBlock> GetChilds()
        {
            return new ExpressionBlock[0];
        }
        public override string AsExpString(IFsDataProvider provider)
        {
            return "null";
        }

    }

}
