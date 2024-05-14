using System.ComponentModel.Design;
using funcscript.core;
using funcscript.model;
using System.Security.Cryptography;
using System.Text;

namespace funcscript.block
{
    public class KvcExpression : ExpressionBlock
    {
        public class KvcExpressionProvider : IFsDataProvider
        {
            private IFsDataProvider _provider;
            private KvcExpression _parent;
            private Dictionary<string, object> _valCache = new Dictionary<string, object>();
            private List<Action> connectionActions;
            public IFsDataProvider ParentProvider => _provider;

            public KvcExpressionProvider(IFsDataProvider provider, KvcExpression parent, List<Action> connectionActions)
            {
                this._provider = provider;
                _parent = parent;
                this.connectionActions = connectionActions;
            }

            public object GetData(string key)
            {
                lock (_valCache)
                {
                    var lower = key.ToLower();
                    if (_valCache.TryGetValue(lower, out var ret))
                        return ret;
                    var val = _parent.index.TryGetValue(lower, out var ch)
                        ? ch.ValueExpression.Evaluate(this, connectionActions)
                        : _provider.GetData(lower);

                    _valCache.Add(lower, val);
                    return val;
                }
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
        public IList<ConnectionExpression> _dataConnections;
        public IList<ConnectionExpression> _signalConnections;
        public Dictionary<string, KeyValueExpression> index;
        public ExpressionBlock singleReturn = null;

        class ConnectionSourceListener
        {
            public object sink;
            public object fault;
            public object vref;

            public void OnChange()
            {
                var source = FuncScript.Dref(vref);
                this.TryConnect(source);
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
                    if (source is SignalSourceDelegate sigSource)
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

            public void OnChange()
            {
                var sink = FuncScript.Dref(vref);
                TryConnect(sink);
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
                    if (sink is ValueSinkDelegate valSink)
                    {
                        valSink(source);
                    }
                    else
                        throw new error.EvaluationTimeException("Invalid connection");
                }
            }
        }

        public String SetKeyValues(IList<KeyValueExpression> kv, ExpressionBlock retExpression,
            IList<ConnectionExpression> datConns,
            IList<ConnectionExpression> sigConns)
        {
            _keyValues = kv;
            _dataConnections = datConns;
            _signalConnections = sigConns;
            this.singleReturn = retExpression;

            if (_keyValues == null)
                index = null;
            else
            {
                index = new Dictionary<string, KeyValueExpression>();
                foreach (var k in _keyValues)
                {
                    k.KeyLower = k.Key.ToLower();
                    if (this.index.ContainsKey(k.KeyLower))
                        return $"Key {k.KeyLower} is duplicated";
                    this.index.Add(k.KeyLower, k);
                }
            }

            return null;
        }

        public IList<KeyValueExpression> KeyValues => _keyValues;


        public override object Evaluate(IFsDataProvider provider, List<Action> connectionActions)
        {
            var evalProvider = new KvcExpressionProvider(provider, this, connectionActions);
            var kvc = new SimpleKeyValueCollection(this._keyValues
                .Select(kv =>
                {
                    return KeyValuePair.Create<string, object>(kv.Key,
                        evalProvider.GetData(kv.Key));
                }).ToArray());

            var pr = new KvcProvider(kvc, provider);
            if (this._dataConnections.Count > 0 || this._signalConnections.Count > 0)
            {
                connectionActions.Add(() =>
                {
                    List<Action> conActions = new List<Action>();
                    foreach (var connection in this._dataConnections)
                    {
                        var source = connection.Source.Evaluate(pr, conActions);
                        var sink = connection.Sink.Evaluate(pr, conActions);
                        var l = new DataConnectionSourceListener()
                        {
                            source = source,
                            vref = sink,
                        };
                        l.TryConnect(sink);
                    }


                    foreach (var connection in this._signalConnections)
                    {
                        var source = connection.Source.Evaluate(pr, conActions);
                        var sink = connection.Sink.Evaluate(pr, conActions);
                        var fault = connection.Catch?.Evaluate(pr, conActions);
                        var l = new ConnectionSourceListener
                        {
                            sink = sink,
                            fault = fault,
                            vref = source,
                        };
                        l.TryConnect(source);
                    }
                });
            }

            if (singleReturn != null)
                return singleReturn.Evaluate(pr, connectionActions);
            return kvc;
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
            foreach (var kv in this.KeyValues)
            {
                sb.Append($"\t\n{kv.Key}: {kv.ValueExpression.AsExpString(provider)},");
            }

            if (this.singleReturn != null)
            {
                sb.Append($"return {this.singleReturn.AsExpString(provider)}");
            }

            sb.Append("}");
            return sb.ToString();
        }
    }
}