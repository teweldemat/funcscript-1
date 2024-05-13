using System.ComponentModel.Design;
using funcscript.core;
using funcscript.model;
using System.Security.Cryptography;
using System.Text;

namespace funcscript.block
{
    
    public class KvcExpression : ExpressionBlock
    {
         public class ExpressionKvc : KeyValueCollection
        {
            private IFsDataProvider _provider;
            private KvcExpression _parent;
            private Dictionary<string, object> _valCache = new Dictionary<string, object>();
            public ExpressionKvc(IFsDataProvider provider, KvcExpression parent)
            {
                this._provider = provider;
                _parent = parent;
            }

            public override object Get(string key)
            {
                lock (_valCache)
                {
                    var lower = key.ToLower();
                    if (_valCache.TryGetValue(lower, out var ret))
                        return ret;
                    var val =_parent.index.TryGetValue(lower,out var ch)
                        ?ch.ValueExpression.Evaluate(new KvcProvider(this,_provider))
                        :_provider.GetData(lower);
                    
                    _valCache.Add(lower, val);
                    return val;
                }

            }

            public override bool ContainsKey(string key)
            {
                return _parent.index.ContainsKey(key.ToLower());
            }

            public override IList<KeyValuePair<string, object>> GetAll()
            {
                return _parent.KeyValues.Where(x=>x.Key!=null).Select(x => new KeyValuePair<String, Object>(x.Key, this.Get(x.Key))).ToArray();
                }
        }
       
        public class KeyValueExpression
        {
            public String Key;
            public String KeyLower;
            public ExpressionBlock ValueExpression;
        }

        public class ConnectionExpression
        {
            public ExpressionBlock Source;
            public ExpressionBlock Sink;
            public ExpressionBlock Catch;
        }
        
        
        public IList<KeyValueExpression> _keyValues;
        public  IList<ConnectionExpression> _dataConnections;
        public  IList<ConnectionExpression> _signalConnections;
        public Dictionary<string, KeyValueExpression> index;
        public KeyValueExpression singleReturn = null;

        public class ConnectionDelegate:ListenerCollection, ValueReferenceDelegate
        {
            public IFsDataProvider Provider;
            public KvcExpression Parent;
            public KvcExpression.ExpressionKvc kvc;         
            public object Value;
            private object lockObject = new Object();
            private bool connected = false;

            class ConnectionSourceListener
            {
                public object sink;
                public object fault;
                public object vref;
                public ConnectionDelegate parent;
                public void OnChange()
                {
                    var source = FuncScript.Dref(vref);
                    this.TryConnect(source);
                    parent.Notify();
                }

                public void TryConnect(object source)
                {
                    if (source is ValueReferenceDelegate r)
                    {
                        vref = r;
                        r.AddListener(this.OnChange);
                    }
                    else
                    {
                        if (source is SignalSourceDelegate sigSource )
                        {
                            sigSource(sink, fault);
                        }
                        else
                            throw new error.EvaluationTimeException("Invalid connection");
                    }

                }
            }
            class DataConnectionSourceListener
            {
                public object source;
                public object vref;
                public ConnectionDelegate parent;
                public void OnChange()
                {
                    var sink = FuncScript.Dref(vref);
                    TryConnect(sink);
                    parent.Notify();
                }

                public void TryConnect(object sink)
                {
                    if (sink is ValueReferenceDelegate r)
                    {
                        vref = r;
                        r.AddListener(this.OnChange);
                    }
                    else
                    {
                        if (sink is ValueSinkDelegate valSink )
                        {
                            valSink(source);
                        }
                        else
                            throw new error.EvaluationTimeException("Invalid connection");
                    }
                }
            }

            public void Connect()
            {
                lock (lockObject)
                {
                    if (!connected)
                    {

                       
                            foreach (var obj in this.kvc.GetAll())
                            {
                                if(obj.Value is ValueReferenceDelegate r)
                                    r.Connect();
                            }

                            if (this.Parent.singleReturn != null)
                            {
                                if(this.Value is ValueReferenceDelegate r)
                                    r.Connect();
                            }
                        

                        var p = new KvcProvider(kvc, Provider);
                        foreach (var connection in this.Parent._dataConnections)
                        {
                            var source = connection.Source.Evaluate(p);
                            var sink = connection.Sink.Evaluate(p);
                            var l = new DataConnectionSourceListener()
                            {
                                source=source,
                                vref = sink,
                                parent = this
                            };
                            l.TryConnect(sink);
                        }
                        


                        foreach (var connection in this.Parent._signalConnections)
                        {
                            var source =   connection.Source.Evaluate(p);
                            var sink = connection.Sink.Evaluate(p);
                            var fault = connection.Catch?.Evaluate(Provider);
                            var l = new ConnectionSourceListener
                            {
                                sink = sink,
                                fault = fault,
                                vref = source,
                                parent = this
                            };
                            l.TryConnect(source);
                        }
                        connected = true;

                    }
                }
            }

            public object Dref()
            {
                
                return Value;
            }
        }

        public String SetKeyValues(IList<KeyValueExpression> kv, IList<ConnectionExpression> datConns,
            IList<ConnectionExpression> sigConns)
        {
            _keyValues = kv;
            _dataConnections = datConns;
            _signalConnections = sigConns;
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
            var kvcObject=new ExpressionKvc(provider, this);
            
            var p = new funcscript.KvcProvider(kvcObject, provider);
            var retObject = this.singleReturn == null ? kvcObject : this.singleReturn.ValueExpression.Evaluate(p);
            
            if (this._dataConnections.Count > 0 || this._signalConnections.Count>0)
            {
                return new ConnectionDelegate
                {
                    Provider = provider,
                    Parent = this,
                    Value = retObject,
                    kvc = kvcObject
                };
            }
            return retObject;
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
