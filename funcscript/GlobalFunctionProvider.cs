using funcscript.core;
using funcscript.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace funcscript
{
    public class DefaultFsDataProvider : IFsDataProvider
    {
        public static bool Trace = false;
        public static string TraceIndent = null;
        public static void IncreateTraceIndent()
        {
            TraceIndent = TraceIndent == null ? "->" : TraceIndent + "->";
        }
        public static void DecreaseTraceIndent()
        {
            if (TraceIndent != null && TraceIndent.Length >= 2)
                TraceIndent = TraceIndent.Substring(0, TraceIndent.Length - 2);
        }
        public static void WriteTraceLine(string line)
        {
            Console.WriteLine(TraceIndent + line);
        }
        static Dictionary<string, IFsFunction> s_funcByName = new Dictionary<string, IFsFunction>();
        static DefaultFsDataProvider()
        {
            LoadFromAssembly(Assembly.GetExecutingAssembly()); //always load builtin functions. May be we don't need this
        }
        public static void LoadFromAssembly(Assembly a)
        {
            foreach (var t in a.GetTypes())
            {
                if (t.GetInterface(typeof(IFsFunction).Name) != null)
                {
                    if (t.GetConstructor(new Type[0]) != null) //load only functions with default constructor
                    {
                        var f = Activator.CreateInstance(t) as IFsFunction;
                        var lower = f.Symbol.ToLower();
                        if (s_funcByName.ContainsKey(lower))
                            throw new Exception($"{f.Symbol} alraedy defined");
                        s_funcByName.Add(lower, f);
                    }
                }
            }
        }
        Dictionary<string, object> _data;
        public DefaultFsDataProvider()
        {
            _data = null;
        }
        public DefaultFsDataProvider(IList<KeyValuePair<string, object>> data)
        {
            _data = new Dictionary<string, object>();
            foreach (var k in data)
            {
                if (k.Value is Func<object>)
                    _data.Add(k.Key, k.Value);
                else
                    _data.Add(k.Key, FuncScript.NormalizeDataType(k.Value));
            }
        }
        public object GetData(string name)
        {
            if (_data != null)
            {
                if (_data.TryGetValue(name, out var v))
                {
                    if (v is Func<object>)
                    {
                        v = ((Func<object>)v)();
                        _data[name] = v;
                    }
                    return v;
                }
            }
            if (s_funcByName.TryGetValue(name, out var ret))
                return ret;
            return null;
        }
    }

    /// <summary>
    /// IFSDataProvider backed by KeyValueCollection
    /// </summary>
    public class KvcProvider : IFsDataProvider
    {
        KeyValueCollection _kvc;
        IFsDataProvider _parent;
        public KvcProvider(KeyValueCollection kvc, IFsDataProvider parent)
        {
            _kvc = kvc;
            _parent = parent;
        }

        public object GetData(string name)
        {
            if (_kvc.ContainsKey(name))
                return _kvc.Get(name);
            if (_parent == null)
                return null;
            return _parent.GetData(name);
        }
    }

}
