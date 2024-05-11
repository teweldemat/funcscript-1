using System.Collections;
using funcscript.core;

namespace funcscript.model;

public class CallRefBuilder
{
    public class BuilderList: FsList
    {
        private FsList _list;
        private int _length;
        private object []_vals;
        private bool[] _done;

        class ListEnum : IEnumerator<object>
        {
            BuilderList _parent;
            private IEnumerator<object> _listEnum;
            private int _index;
            public ListEnum(BuilderList parent)
            {
                this._parent = parent;
                this._listEnum = parent._list.GetEnumerator();
                _index =-1;
            }
            public bool MoveNext()
            {
                _index++;
                return this._listEnum.MoveNext();
            }

            public void Reset()
            {
                _index = -1;
                this._listEnum.Reset();
            }

            public object Current => _parent[_index];

            object IEnumerator.Current => Current;

            public void Dispose()
            {
                
            }
        }
        public BuilderList(FsList list)
        {
            _list = list;
            _length = _list.Length;
            _vals = new object[_length];
            _done = new bool[_length];
            
        }

        public override object this[int index]
        {
            get
            {
                if (index < 0 || index >= _length)
                    return null;
                if (_done[index])
                    return _vals[index];
                var val = _list[index];
                _done[index] = true;
                _vals[index] = val;
                return val;
            }
        }

        public override int Length => _length;
        public override IEnumerator<object> GetEnumerator()
        {
            return new ListEnum(this);
        }

        public void RetrieveAll()
        {
            for (int i = 0; i < _length; i++)
            {
                if (!_done[i])
                {
                    _vals[i] = _list[i];
                    _done[i] = true;
                }
            }
        }

        public FsList GetRefList()
        {
            return new ArrayFsList(_vals);
        }
    }

    public class BuilderKvc : KeyValueCollection
    {
        private KeyValueCollection _kvc;
        private Dictionary<string, object> _loaded = new Dictionary<string, object>();
        public BuilderKvc(KeyValueCollection kvc)
        {
            _kvc = kvc;
        }
        public override object Get(string key)
        {
            if (_loaded.TryGetValue(key, out var ret))
                return ret;
            if (!_kvc.ContainsKey(key))
                return null;
            var val = _kvc.Get(key);
            _loaded.Add(key,val);
            return val;
        }

        public override bool ContainsKey(string key)
        {
            return _kvc.ContainsKey(key);
        }

        public override IList<KeyValuePair<string, object>> GetAll()
        {
            var all = _kvc.GetAll();
            foreach (var kv in all)
            {
                _loaded.TryAdd(kv.Key,kv.Value);
            }

            return all;
        }

        public void RetrieveAll()
        {
            GetAll();
        }

        public KeyValueCollection GetRefKvc()
        {
            return new SimpleKeyValueCollection(_loaded.ToArray());
        }
    }
    private IFsDataProvider _provider;
    private IParameterList _pars;
    private int _length;
    private object[] _vals;
    private bool[] _done;
    private object _target;
    public CallRefBuilder(object target, IFsDataProvider provider, IParameterList pars)
    {
        this._provider = provider;
        this._pars = pars;
        this._length = pars.Count;
        this._vals = new object[_length];
        this._done = new bool[_length];
        this._target = target;
    }

    public object GetParameter(int index)
    {
        if (index < 0 || index >= _length)
            return null;
        if (_done[index])
            return _vals[index];
        var ret = _pars.GetParameter(_provider, index);
        if (ret is FsList lst)
            ret = new BuilderList(lst);
        else if (ret is KeyValueCollection kvc)
            ret = new BuilderKvc(kvc);
        _done[index] = true;
        _vals[index] = ret;
        return ret;
    }

    
    public ValueReferenceDelegate CreateRef()
    {
        for (int i = 0; i < _length; i++)
        {
            var val = _done[i] ? _vals[i] : (_vals[i]=GetParameter(i));
            if (val is BuilderList blist)
            {
                blist.RetrieveAll();
                _vals[i] = blist.GetRefList();
            }
            else if (val is BuilderKvc bkvc)
            {
                bkvc.RetrieveAll();
                _vals[i] = bkvc.GetRefKvc();
            }

        }

        return CallRef.Create(_provider, _target,_vals);
    }

    public ValueReferenceDelegate CreateRefForLoadedPars()
    {
        return CallRef.Create(_provider, _target,_vals);
    }
}