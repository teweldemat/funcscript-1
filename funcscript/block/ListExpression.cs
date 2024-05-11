using funcscript.core;
using funcscript.model;
using System.Text;
using Newtonsoft.Json.Serialization;

namespace funcscript.block
{
    public class ListExpression:ExpressionBlock
    {
        class ListExpressionList : FsList
        {
            private readonly ListExpression _parent;
            private IFsDataProvider _provider;

            public ListExpressionList(ListExpression parent, IFsDataProvider provider)
            {
                _provider = provider;
                _parent = parent;
            }

            public override object this[int index]
            {
                get
                {
                    if (index < 0 || index >= _parent.ValueExpressions.Length)
                        return null;
                    return _parent.ValueExpressions[index].Evaluate((_provider));
                }
            }

            public override int Length => _parent.ValueExpressions.Length;
            public override IEnumerator<object> GetEnumerator()
            {
                for (int i = 0; i < _parent.ValueExpressions.Length; i++)
                {
                    yield return _parent.ValueExpressions[i].Evaluate(_provider);
                }
            }

        }
        public ExpressionBlock[] ValueExpressions;

       
        public override object Evaluate(IFsDataProvider provider)
        {
            //var lst = ValueExpressions.Select(x => x.Evaluate(provider)).ToArray();
            //return new ArrayFsList(lst);
            return new ListExpressionList(this, provider);
        }
        public override IList<ExpressionBlock> GetChilds()
        {
            var ret = new List<ExpressionBlock>();
            ret.AddRange(this.ValueExpressions);
            return ret;
        }
        public override string ToString()
        {
            return "list";
        }
        public override string AsExpString(IFsDataProvider provider)
        {
            var sb = new StringBuilder();
            sb.Append("[");
            
            foreach (var val in this.ValueExpressions)
            {
                sb.Append($"{val.AsExpString(provider)},");
            }
            sb.Append("]");
            return sb.ToString();
        }
    }
}
