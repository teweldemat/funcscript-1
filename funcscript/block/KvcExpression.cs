using funcscript.core;
using funcscript.model;
using System.Security.Cryptography;
using System.Text;

namespace funcscript.block
{
    public class KvcExpression : ExpressionBlock
    {
        class KvcProvider : IFsDataProvider
        {
            IFsDataProvider ParentProvider;
            Dictionary<string, object> vals = new Dictionary<string, object>();
            KvcExpression Parent;
            public KvcProvider(KvcExpression Parent, IFsDataProvider ParentProvider)
            {
                this.Parent = Parent;
                this.ParentProvider = ParentProvider;
            }
            String _evaluating = null;
            public object GetData(string name)
            {
                if (vals.TryGetValue(name, out var val))
                    return val;
                if (_evaluating == null || name != _evaluating)
                {
                    if (Parent.index.TryGetValue(name, out var exp) && exp.ValueExpression != null)
                    {
                        _evaluating = name;
                        var v = exp.ValueExpression.Evaluate(this);
                        _evaluating = null;
                        vals[name] = v;
                        return v;
                    }
                }
                return ParentProvider.GetData(name);
            }
        }
        public class KeyValueExpression
        {
            public String Key;
            public String KeyLower;
            public ExpressionBlock ValueExpression;
        }
        IList<KeyValueExpression> _keyValues;
        Dictionary<string, KeyValueExpression> index;
        KeyValueExpression singleReturn = null;
        public String SetKeyValues(IList<KeyValueExpression> kv)
        {
            _keyValues = kv;
            if (_keyValues == null)
                index = null;
            {
                index = new Dictionary<string, KeyValueExpression>();
                singleReturn = null;
                foreach (var k in _keyValues)
                {
                    if (k.Key == null)
                    {
                        if (this.singleReturn != null)
                            return "Ambigues return expressions";
                        this.singleReturn = k;
                    }
                    else
                    {
                        k.KeyLower = k.Key.ToLower();
                        if (this.index.ContainsKey(k.KeyLower))
                            return $"Key {k.KeyLower} is duplicated";
                        this.index.Add(k.KeyLower, k);
                    }

                }
            }
            return null;
        }
        public IList<KeyValueExpression> KeyValues => _keyValues;
        public override object Evaluate(IFsDataProvider provider)
        {
            var p = new KvcProvider(this, provider);
            if (this.singleReturn == null)
            {
                var kv = KeyValues.Select(x => new KeyValuePair<String, Object>(x.Key, p.GetData(x.KeyLower))).ToArray();
                return new SimpleKeyValueCollection(kv);
            }
            else
            {
                return this.singleReturn.ValueExpression.Evaluate(p);
            }

        }
        public override IList<ExpressionBlock> GetChilds()
        {
            var ret = new List<ExpressionBlock>();
            ret.AddRange(this.KeyValues.Select(x => x.ValueExpression));
            return ret;
        }
        public override string ToString()
        {
            return "Key-values";
        }
        public override string AsExpString(IFsDataProvider provider)
        {
            var sb = new StringBuilder();
            sb.Append("{\n");
            foreach(var kv in this.KeyValues)
            {
                sb.Append($"\t\n{kv.Key}: {kv.ValueExpression.AsExpString(provider)},");
            }
            if(this.singleReturn!=null)
            {
                sb.Append($"return {this.singleReturn.ValueExpression.AsExpString(provider)}");
            }
            sb.Append("}");
            return sb.ToString();
        }
    }
}
