using System.Diagnostics.SymbolStore;
using System.Runtime.Serialization;
using funcscript.core;
using System.Text;
using funcscript.error;
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
            public bool IsDefined(string key)
            {
                return expressionFunction.ParamterNameIndex.ContainsKey(key)
                       || parentSymbolProvider.IsDefined(key);
            }

            public object GetData(string name)
            {
                if (expressionFunction.ParamterNameIndex.TryGetValue(name, out var index))
                    return pars.GetParameter(parentSymbolProvider, index);
                return parentSymbolProvider.GetData(name);
            }
        }

        public ExpressionBlock Expression { get; set; }

        private Dictionary<string, int> ParamterNameIndex;
        private String[] _parameters;
        private ValueReferenceDelegate[] _parameterRefs = null;
        private object _expressionValue = null;
        private IFsDataProvider _context = null;

        public void SetContext(IFsDataProvider context)
        {
            if (_context != null)
                throw new EvaluationTimeException("Context for expression function already set");
            _context = context;
        }
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
            if (_context == null)
                throw new error.EvaluationTimeException("Context not set to expression function");
            List<Action> connectionActions=new List<Action>();
            var (ret,_)= Expression.Evaluate(new ParameterDataProvider
            {
                expressionFunction = this,
                parentSymbolProvider = new KvcProvider(_context,parent),
                pars = pars
            },connectionActions);
            foreach (var con in connectionActions)
            {
                con.Invoke();
            }

            return ret;
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