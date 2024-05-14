using funcscript.core;

namespace funcscript.block
{
    public class NullExpressionBlock : ExpressionBlock
    {
        public override object Evaluate(IFsDataProvider provider,List<Action> connectionActions)
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
