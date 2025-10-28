using System.Collections;
using System.Collections.Specialized;
using FuncScript.Core;

namespace FuncScript.Model
{

    /// <summary>
    /// Abstract base class for KeyValueCollection FuncScript data type
    /// </summary>
    public abstract class  KeyValueCollection:IFsDataProvider
    {
        /// <summary>
        /// Gets value for a given key
        /// </summary>
        /// <param name="key">key in small letters</param>
        /// <returns></returns>
        public abstract object Get(string key);

        public abstract IFsDataProvider ParentProvider { get; }

        /// <summary>
        /// Checks if key exists
        /// </summary>
        /// <param name="key">Key in small letters</param>
        /// <returns></returns>
        public abstract bool IsDefined(string key);
        /// <summary>
        /// Converts the KVC to a .net type
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <returns></returns>
        public T ConvertTo<T>()
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<T>(Engine.FormatToJson(this));
        }
        /// <summary>
        /// Converst a KVC to a .net type
        /// </summary>
        /// <param name="t"></param>
        /// <returns></returns>
        public object ConvertTo(Type t)
        {
            var json = Engine.FormatToJson(this);
            return Newtonsoft.Json.JsonConvert.DeserializeObject(json,t);
        }
        /// <summary>
        /// Returns list of all Key-Value-Pairs in the KVC
        /// </summary>
        /// <returns></returns>
        public abstract IList<KeyValuePair<String, object>> GetAll();
        /// <summary>
        /// Checks if the KVC equals with another object
        /// </summary>
        /// <param name="otherkv"></param>
        /// <returns></returns>
        public override bool Equals(object otherkv)
        {
            var other = otherkv as KeyValueCollection;
            if (other == null)
                return false;
            foreach(var k in other.GetAll())
            {
                if (!this.IsDefined(k.Key.ToLowerInvariant()))
                    return false;
                var thisVal= this.Get(k.Key);
                var otherVal= other.Get(k.Key);
                if (thisVal == null && otherVal == null)
                    return true;
                if (thisVal == null || otherVal == null)
                    return false;
                if (!thisVal.Equals(otherVal))
                    return false;
            }
            return true;
        }
        
        /// <summary>
        /// Merges to key value pairs. The merged KVC will have keys from both collections
        /// If a key exists in both KVCs the value in the merged KVC is determined as follows
        ///     if both values are KVCs themselves, the values are themselves merged
        ///     Otherwise the value from the second KVC is taken
        /// </summary>
        /// <param name="col1">First KVC</param>
        /// <param name="col2">Second KVC</param>
        /// <returns></returns>
        public static KeyValueCollection Merge(KeyValueCollection col1,KeyValueCollection col2)
        {
            if (col1 == null && col2 == null)
                return null;
            if (col1 == null)
                return col2;
            if (col2 == null)
                return col1;
            var dict = new OrderedDictionary();
            foreach (var kv in col1.GetAll())
                dict[kv.Key] = kv.Value;
            foreach (var kv in col2.GetAll())
            {
                if(dict.Contains(kv.Key))
                {
                    var left = dict[kv.Key] as KeyValueCollection;
                    if (left != null && kv.Value is KeyValueCollection)
                    {
                        dict[kv.Key] = KeyValueCollection.Merge(left,(KeyValueCollection)kv.Value);
                    }
                    else
                        dict[kv.Key] = kv.Value;
                }
                else
                    dict.Add(kv.Key,kv.Value);
            }
            var kvs = new KeyValuePair<string, object>[dict.Count];
            var en = (IDictionaryEnumerator)dict.GetEnumerator();
            int k = 0;
            while (en.MoveNext())
            {
                kvs[k] = new KeyValuePair<string, object>((string)en.Key, en.Value);
                k++;
            }

            if (col1.ParentProvider != col2.ParentProvider)
                throw new Error.EvaluationTimeException(
                    "Key value collections from different contexts can't be merged");
            return new SimpleKeyValueCollection(col1.ParentProvider,kvs);
        }
        public override int GetHashCode()
        {
            int hash = 0;
            foreach(var kv in this.GetAll())
            {
                var thisHash = kv.Value == null ? kv.Key.GetHashCode() : HashCode.Combine(kv.Key.GetHashCode(), kv.Value.GetHashCode());
                if (hash == 0)
                    hash = thisHash;
                else
                    hash = HashCode.Combine(hash, thisHash);
            }
            return hash;
        }
    }
}
