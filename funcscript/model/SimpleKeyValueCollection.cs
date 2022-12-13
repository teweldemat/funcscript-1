using System.Text;

namespace funcscript.model
{
    public class SimpleKeyValueCollection: KeyValueCollection
    {
        KeyValuePair<String, object>[] _data;
        Dictionary<String, object> _index;
        public SimpleKeyValueCollection()
        {

        }
        
        public SimpleKeyValueCollection(KeyValuePair<string, object>[] kv)
        {
            this.Data = kv;
        }

        public KeyValuePair<String,object>[] Data 
        { 
            get
            {
                return _data;
            }
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

        public override object Get(string value)
        {
            if(_index.TryGetValue(value,out var item))
                return item;
            return null;
        }
        public override bool ContainsKey(string value)
        {
            return _index.ContainsKey(value);
        }

        public override IList<KeyValuePair<string, object>> GetAll()
        {
            return this._data;
        }
    }
}
