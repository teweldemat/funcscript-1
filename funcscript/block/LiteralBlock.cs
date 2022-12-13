using System.Text;
using funcscript.core;

namespace funcscript.block
{
    public class LiteralBlock : ExpressionBlock
    {
        public object Value;
        public LiteralBlock(object val)
        {
            Value = val;
        }

        public override string AsExpString(IFsDataProvider provider)
        {
            var sb = new StringBuilder();
            FuncScript.Format(sb, Value, null, true, false);
            return sb.ToString();
        }

        public override object Evaluate(IFsDataProvider provider)
        {
            return Value;
        }
        public override IList<ExpressionBlock> GetChilds()
        {
            return new ExpressionBlock[0];
        }
        public override string ToString()
        {
            if (Value == null)
                return "";
            return Value.ToString();
        }

    }

}
