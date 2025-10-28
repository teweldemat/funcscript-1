﻿using System.Collections.Generic;
using System.Reflection;
using FuncScript.Core;

namespace FuncScript.Model
{
    public class ObjectKvc:KeyValueCollection
    {
        class PropInfo
        {
            public String Name;
            public PropertyInfo Prop=null;
            public FieldInfo Field=null;
        }
        class TypeInfo
        {
            public Dictionary<String, PropInfo> Properties = new Dictionary<string, PropInfo>();

        }
        static Dictionary<Type, TypeInfo> s_typeInfos = new Dictionary<Type, TypeInfo>();
        static TypeInfo GetTypeInfo(Type t)
        {
            lock(s_typeInfos)
            {
                if (s_typeInfos.TryGetValue(t, out var info))
                    return info;
                var tinfo = new TypeInfo();
                foreach (var prop in t.GetProperties().Where(p => p.CanRead && p.GetMethod.GetParameters().Length == 0))
                {
                        tinfo.Properties.Add(prop.Name.ToLower(), new PropInfo { Name = prop.Name, Prop = prop });
                }
                foreach (var field in t.GetFields())
                {
                    if (field.IsStatic)
                        continue;
                    tinfo.Properties.Add(field.Name.ToLower(), new PropInfo { Name = field.Name, Field= field});
                }
                s_typeInfos.Add(t, tinfo);
                return tinfo;
            }
        }
        object _val;

        protected ObjectKvc()
        {
            
        }
        public ObjectKvc(object val)
        {
            this.SetVal(val);
        }

        protected void SetVal(object val)
        {
            this._val = val;
        }
        public object GetUnderlyingValue() => _val;
        public override bool IsDefined(string key)
        {
            if (_val == null)
                return false;
            var t = _val.GetType();
            return GetTypeInfo(t).Properties.ContainsKey(key);
        }

        public override object Get(string key)
        {
            if (_val == null)
                return null;
            var t = _val.GetType();
            var tInfo = GetTypeInfo(t);
            if (!tInfo.Properties.TryGetValue(key, out var val))
                return null;
            if(val.Prop!=null)
                return Engine.NormalizeDataType(val.Prop.GetValue(_val));
            return Engine.NormalizeDataType(val.Field.GetValue(_val));
        }

        public override IFsDataProvider ParentProvider => null;

        public override IList<KeyValuePair<string, object>> GetAll()
        {
            var list = new List<KeyValuePair<string, object>>();
            if (_val == null)
                return list;
            var t = _val.GetType();
            var tInfo = GetTypeInfo(t);
            foreach (var prop in tInfo.Properties)
            {
                var val = prop.Value.Field == null ?
                        prop.Value.Prop.GetValue(_val) : prop.Value.Field.GetValue(_val);
                val = Engine.NormalizeDataType(val);
                list.Add(KeyValuePair.Create(prop.Value.Name, val));
            }
            return list;
        }
        
    }
}
