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
            public IParameterList pars;
            public IFsDataProvider parentSymbolProvider;
            public ExpressionFunction expressionFunction;
            public IFsDataProvider ParentProvider => parentSymbolProvider;
            public object GetData(string name)
            {
                if (expressionFunction.ParamterNameIndex.TryGetValue(name, out var index))
                    return pars.GetParameter(parentSymbolProvider, index);
                return parentSymbolProvider.GetData(name);
            }
        }

        public ExpressionBlock Expression { get; set; }

        public Dictionary<string, int> ParamterNameIndex;
        public String[] _parameters;
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

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            return Expression.Evaluate(new ParameterDataProvider
            {
                expressionFunction = this,
                parentSymbolProvider = parent,
                pars = pars
            });
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