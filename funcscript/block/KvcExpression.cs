using System.ComponentModel.Design;
using System.Data;
using funcscript.core;
using funcscript.model;
using System.Security.Cryptography;
using System.Text;
using funcscript.error;

namespace funcscript.block
{
    public class KvcExpression : ExpressionBlock
    {
        private class KvcExpressionProvider : IFsDataProvider
        {
            private readonly KvcExpression _parent;
            private readonly Dictionary<string, object> _valCache = new Dictionary<string, object>();
            private readonly List<Action> _connectionActions;
            public IFsDataProvider ParentProvider { get; }

            public bool IsDefined(string key)
            {
                return _parent.index.ContainsKey(key);
            }

            public KvcExpressionProvider(IFsDataProvider provider, KvcExpression parent, List<Action> connectionActions)
            {
                this.ParentProvider = provider;
                _parent = parent;
                this._connectionActions = connectionActions;
            }
            String _evaluating = null;
            public object Get(string name)
            {
                if (_valCache.TryGetValue(name, out var val))
                    return val;
                if (_evaluating == null || name != _evaluating)
                {
                    if (_parent.index.TryGetValue(name, out var exp) && exp.ValueExpression != null)
                    {
                        _evaluating = name;
                        var v = exp.ValueExpression.Evaluate(this,_connectionActions).Item1;
                        _evaluating = null;
                        _valCache[name] = v;
                        return v;
                    }
                }
                return ParentProvider.Get(name);
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
        public ExpressionBlock singleReturn = null;

        private IList<ConnectionExpression> _dataConnections;
        public IList<ConnectionExpression> _signalConnections;
        private Dictionary<string, KeyValueExpression> index;

        class ConnectionInfo
        {
            public object sink;
            public object vref;

            public CodeLocation location;

            protected void ThrowInvalidConnectionError(string msg)
            {
                throw new error.EvaluationException(location, new TypeMismatchError(msg));
            }
        }

        class ConnectionSourceListener : ConnectionInfo
        {
            public object fault;

            public void OnChange()
            {
                var source = FuncScript.Dref(vref,false);
                this.TryConnect(source);
            }

            public void TryConnect(object source)
            {
                if (source is SignalSourceDelegate sigSource)
                {
                    try
                    {
                        sigSource.SetSource(sink, fault);
                    }
                    catch (Exception ex)
                    {
                        throw new EvaluationException(location, ex);
                    }
                }
                else if (source is ValueReferenceDelegate r)
                {
                    vref = r;
                    r.AddListener(this.OnChange);
                }
                else
                    ThrowInvalidConnectionError("Invalid connection, source should be a signal source");
            }
        }

        class DataConnectionSourceListener : ConnectionInfo
        {
            public object source;

            public void OnChange()
            {
                var sink = FuncScript.Dref(vref,true);
                TryConnect(sink);
            }

            public void TryConnect(object sink)
            {
                if (sink is ValueSinkDelegate valSink)
                {
                    try
                    {
                        valSink.SetValueSource(source);
                    }
                    catch (Exception ex)
                    {
                        throw new EvaluationException(location, ex);
                    }
                }
                else if (sink is ValueReferenceDelegate r)
                {
                    vref = r;
                    r.AddListener(this.OnChange);
                }
                else
                    ThrowInvalidConnectionError("Invalid connection, data should be a data source");
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

        public override (object, CodeLocation) Evaluate(IFsDataProvider provider, List<Action> connectionActions)
        {
            var evalProvider = new KvcExpressionProvider(provider, this, connectionActions);

            var kvc = new SimpleKeyValueCollection(null, this._keyValues
                .Select(kv => KeyValuePair.Create<string, object>(kv.Key,
                    kv.ValueExpression.Evaluate(evalProvider,connectionActions).Item1)).ToArray());
            
            if (this._dataConnections.Count > 0 || this._signalConnections.Count > 0)
            {
                var pr =new KvcProvider(kvc, provider);
                connectionActions.Add(() =>
                {
                    List<Action> conActions = new List<Action>();
                    foreach (var connection in this._dataConnections)
                    {
                        var source = connection.Source.Evaluate(pr, conActions).Item1;
                        var sink = connection.Sink.Evaluate(pr, conActions).Item1;
                        var l = new DataConnectionSourceListener()
                        {
                            source = source,
                            vref = sink,
                            location = connection.Source.CodeLocation
                        };
                        l.TryConnect(sink);
                    }


                    foreach (var connection in this._signalConnections)
                    {
                        var source = connection.Source.Evaluate(pr, conActions).Item1;
                        var sink = connection.Sink.Evaluate(pr, conActions).Item1;
                        var fault = connection.Catch?.Evaluate(pr, conActions).Item1;
                        var l = new ConnectionSourceListener
                        {
                            sink = sink,
                            fault = fault,
                            vref = source,
                            location = CodeLocation.Span(connection.Source.CodeLocation, connection.Sink.CodeLocation,
                                connection.Catch?.CodeLocation)
                        };
                        l.TryConnect(source);
                    }
                });
            }

            if (singleReturn != null)
            {
                return singleReturn.Evaluate(evalProvider, connectionActions);
            }
            return (kvc, this.CodeLocation);
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