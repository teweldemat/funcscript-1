using funcscript.core;
using System.Text;

namespace funcscript.core
{
    public class ExpressionFunction : IFsFunction
    {
        class ParamerDataProvider:IFsDataProvider
        {
            public IParameterList pars;
            public IFsDataProvider parentSymbolProvider;
            public ExpressionFunction parent;
            public object GetData(string name)
            {
                if (parent.ParamterNameIndex.ContainsKey(name))
                    return pars[parent.ParamterNameIndex[name]];
                return parentSymbolProvider.GetData(name);
            }
        }
        public ExpressionBlock Expression {get;set;}
        
        public Dictionary<String, int> ParamterNameIndex;
        public String [] Parameters;
        
        public ExpressionFunction(String[] pars,ExpressionBlock exp)
        {
            this.Expression = exp;
            this.Parameters = pars;
            this.ParamterNameIndex = new Dictionary<String, int>();
            var i = 0;
            foreach(var n in pars)
                this.ParamterNameIndex.Add(n.ToLower(),i++);
        }
        public int MaxParsCount => Parameters.Length;
        public CallType CallType => CallType.Infix;

        public string Symbol => null;

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            return Expression.Evaluate(new ParamerDataProvider { parent = this, parentSymbolProvider = parent, pars = pars });
        }

        public string ParName(int index)
        {
            return Parameters[index];
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
