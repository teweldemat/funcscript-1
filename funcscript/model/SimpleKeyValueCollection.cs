using System.Text;
using funcscript.core;

namespace funcscript.model
{
    public class SimpleKeyValueCollection: KeyValueCollection
    {
        private IFsDataProvider _parent;
        KeyValuePair<String, object>[] _data;
        Dictionary<String, object> _index;
        public SimpleKeyValueCollection()
        {

        }
        
        public SimpleKeyValueCollection(IFsDataProvider parent, KeyValuePair<string, object>[] kv)
        {
            this.Data = kv;
            this._parent = parent;
        }

        public KeyValuePair<String,object>[] Data 
        { 
            set
            {
                _data=value;
                if(value == null)
                {
                    _index = null;
                    return;
                }
                _index = new Dictionary<string, object>();
                foreach (var kv in value)
                    _index.Add(kv.Key.ToLower(), kv.Value);
            }
        }

        public override object GetData(string value)
        {
            return _index.GetValueOrDefault(value);
        }

        public override IFsDataProvider ParentProvider => _parent;

        public override bool IsDefined(string value)
        {
            return _index.ContainsKey(value);
        }

        public override IList<KeyValuePair<string, object>> GetAll()
        {
            return this._data;
        }
    }
}
