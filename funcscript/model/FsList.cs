using System.ComponentModel;
using System.Reflection;
using System.Text;

namespace funcscript.model
{
    public class FsList
    {
        enum ListInternalType
        {
            Null,
            IList,
            IListGeneric,
            NotList
        }

        object[] _data;
        public object[] Data
        {
            get
            {
                return _data;
            }
            set
            {
                _data = value;
            }
        }
        public FsList(object[] data)
        {
            _data = data;
        }
       
        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
            {
                return false;
            }
            var other = (FsList)obj;
            if (other.Data.Length != _data.Length)
                return false;
            for(int i=0;i<other.Data.Length;i++)
            {
                var val1 = _data[i];
                var val2 = other.Data[i];
                if (val1==null && val2==null)
                    return true;
                if (val1 == null || val2 == null)
                    return false;
                if (!val1.Equals(val2))
                    return false;
            }
            return true;
        }
        public override string ToString()
        {
            if (_data == null)
                return "Uninitialized list";
            var sb = new StringBuilder();
            sb.Append("[");
            if (Data.Length > 0)
            {
                if (_data[0] == null)
                    sb.Append("null");
                else
                    sb.Append(_data[0].ToString());
                for (int i = 1; i < _data.Length; i++)
                {
                    sb.Append(",");
                    if (_data[i] == null)
                        sb.Append("null");
                    else
                        sb.Append(_data[i].ToString());
                }
            }
            sb.Append("]");
            return sb.ToString();
        }
        // override object.GetHashCode
        public override int GetHashCode()
        {
            return _data.GetHashCode();
        }
        
        public FsList(object data)
        {
            if (data == null)
                throw new error.TypeMismatchError("Null can't be converted to list");
            else
            {
                var t = data.GetType();
                if(t.IsAssignableTo(typeof(System.Collections.IList)))
                {
                    var l = (System.Collections.IList)data;
                    _data = new object[l.Count];
                    for (int i = 0; i < l.Count; i++)
                        _data[i] = FuncScript.NormalizeDataType(l[i]);
                } 
                else
                {
                    throw new error.TypeMismatchError($"{t} can't be used as list");
                }
            }
        }

        public static bool IsListTyp(Type t) =>
            t.IsAssignableTo(typeof(System.Collections.IList)) || IsGenericList(t);
        static bool IsGenericList(Type t)
        {
            return t != typeof(byte[]) && t.IsGenericType && (t.GetGenericTypeDefinition().IsAssignableTo(typeof(IList<>))
                || t.GetGenericTypeDefinition().IsAssignableTo(typeof(List<>)));
        }
        
        
    }
}
