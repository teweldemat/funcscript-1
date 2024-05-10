using System.Diagnostics.SymbolStore;
using System.Runtime.Serialization;
using funcscript.core;
using System.Text;
using funcscript.model;

namespace funcscript.core
{
    public class ExpressionFunction : IFsFunction
    {
        private class ParameterDataProvider : IFsDataProvider
        {
            public bool preEvalMode = false;
            public IParameterList pars;
            public IFsDataProvider parentSymbolProvider;
            public ExpressionFunction expressionFunction;

            public object GetData(string name)
            {
                if (expressionFunction.ParamterNameIndex.TryGetValue(name, out var index))
                {
                    if (preEvalMode)
                    {
                        if (expressionFunction._parameterRefs[index] != null)
                            return expressionFunction._parameterRefs[index];
                        return expressionFunction._parameterRefs[index] = () =>
                            throw new InvalidDataContractException(
                                $"It is not allowed to dereference parameter {index} using the template reference");
                    }
                    else
                    {
                        return pars.GetParameter(parentSymbolProvider, index);
                    }
                }

                return parentSymbolProvider.GetData(name);
            }
        }

        public ExpressionBlock Expression { get; set; }

        public Dictionary<string, int> ParamterNameIndex;
        public String[] _parameters;
        private bool PreEvaluated = false;
        private ValueReferenceDelegate[] _parameterRefs = null;
        private object _expressionValue = null;

        public ExpressionFunction(String[] pars, ExpressionBlock exp)
        {
            this.Expression = exp;
            this._parameters = pars;
            this.ParamterNameIndex = new Dictionary<String, int>();
            var i = 0;
            foreach (var n in pars)
                this.ParamterNameIndex.Add(n.ToLower(), i++);
        }

        public int MaxParsCount => _parameters.Length;
        public CallType CallType => CallType.Infix;

        public string Symbol => null;

        public int Precidence => 0;

        object CreateClone(IFsDataProvider parent, Dictionary<ValueReferenceDelegate, object> cache,
            IParameterList pars, CallRef callRef)
        {
            return CallRef.Create(callRef.Vals.Select(val =>
            {
                if (val is ValueReferenceDelegate valRef)
                {
                    int parRefIndex;
                    if (valRef.Target is CallRef cref)
                    {
                        return CreateClone(parent, cache, pars, cref);
                    }
                    else if ((parRefIndex = Array.IndexOf(_parameterRefs, valRef)) != -1)
                    {
                        if (cache.TryGetValue(valRef, out var parValue))
                            return parValue;
                        return cache[valRef] = pars.GetParameter(parent, parRefIndex);
                    }
                    /*else
                        throw new InvalidOperationException(
                            $"Type {valRef.GetType()} is not supported ExpressionFunction.Evaluate in preevaluated mode");*/
                }

                return val;
            }).ToArray());
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (PreEvaluated)
            {
                var cache = new Dictionary<ValueReferenceDelegate, object>();

                if (_expressionValue is ValueReferenceDelegate valRef)
                {
                    int parRefIndex;
                    if (valRef.Target is CallRef cref)
                    {
                        return FuncScript.Dref(CreateClone(parent, cache, pars, cref));
                    }
                    else if ((parRefIndex = Array.IndexOf(_parameterRefs, valRef)) != -1)
                    {
                        if (cache.TryGetValue(valRef, out var parValue))
                            return parValue;
                        return cache[valRef] = pars.GetParameter(parent, parRefIndex);
                    }
                    /*else
                        throw new InvalidOperationException(
                            $"Type {valRef.GetType()} is not supported ExpressionFunction.Evaluate in pre-evaluated mode");*/
                }

                return _expressionValue;
            }

            return Expression.Evaluate(new ParameterDataProvider
            {
                expressionFunction = this,
                parentSymbolProvider = parent,
                pars = pars
            });
        }

        public void PreEvaluate(IFsDataProvider provider)
        {
            lock (this.Expression)
            {
                if (PreEvaluated)
                    return;
                this._parameterRefs = new ValueReferenceDelegate[this._parameters.Length];
                this._expressionValue = Expression.Evaluate(new ParameterDataProvider
                {
                    expressionFunction = this,
                    preEvalMode = true,
                    parentSymbolProvider = provider,
                });
                PreEvaluated = true;
            }
        }

        public string ParName(int index)
        {
            return _parameters[index];
        }

        public override String ToString()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append(this.Symbol);
            sb.Append('(');
            int c = this.MaxParsCount;
            for (int i = 0; i < c; i++)
            {
                if (i > 0)
                    sb.Append(',');
                sb.Append(this.ParName(i));
            }

            sb.Append(')');
            sb.Append("=>");
            sb.Append(this.Expression.AsExpString(new DefaultFsDataProvider()));
            return sb.ToString();
        }
    }

    
}