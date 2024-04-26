using funcscript.core;
using funcscript.error;
using funcscript.model;
using System.Text;

namespace funcscript.block
{
    public class FunctionCallExpression : ExpressionBlock, IParameterList
    {
        public ExpressionBlock Function;
        public ExpressionBlock[] Parameters;
        IFsDataProvider _provider;
        public object this[int index]
        {
            get
            {
                var ret = index < 0 || index >= Parameters.Length ? null : Parameters[index].Evaluate(_provider);
                if (DefaultFsDataProvider.Trace)
                {
                    DefaultFsDataProvider.WriteTraceLine($"Par {index} - {ret}");
                }
                return ret;
            }
        }

        public int Count => Parameters.Length;

        public override object Evaluate(IFsDataProvider provider)
        {
            _provider = provider;
            var func = Function.Evaluate(provider);
            if (func is IFsFunction)
            {
                string fn = null;
                if (DefaultFsDataProvider.Trace)
                {
                    DefaultFsDataProvider.IncreateTraceIndent();
                    fn = ((IFsFunction)func).Symbol;
                    if (fn == null)
                        fn = func.ToString();
                    DefaultFsDataProvider.WriteTraceLine($"Evaluating function {fn}");
                }
                try
                {
                    var ret = ((IFsFunction)func).Evaluate(provider, this);
                    if (DefaultFsDataProvider.Trace)
                    {
                        DefaultFsDataProvider.DecreaseTraceIndent();
                        DefaultFsDataProvider.WriteTraceLine($"Result of {fn}: {ret}");
                    }
                    return ret;
                }
                catch (error.EvaluationException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    throw new error.EvaluationException(this.Pos, this.Length, ex);
                }

            }
            else if (func is FsList)
            {
                var index = this[0];
                if (DefaultFsDataProvider.Trace)
                {
                    DefaultFsDataProvider.IncreateTraceIndent();
                    DefaultFsDataProvider.WriteTraceLine($"Acccesing list element {func} ({index})");
                }
                object ret;
                if (index is int)
                {
                    var i = (int)index;
                    var lst = (FsList)func;
                    if (i < 0 || i >= lst.Data.Length)
                        ret = null;
                    else
                        ret = lst.Data[i];
                }
                else
                    ret = null;
                if (DefaultFsDataProvider.Trace)
                {
                    DefaultFsDataProvider.WriteTraceLine($"Result {ret}");
                    DefaultFsDataProvider.DecreaseTraceIndent();

                }
                return ret;
            }
            else if (func is KeyValueCollection collection)
            {
                var index = this[0];

                object ret;
                if (index is string key)
                {
                    var kvc = collection;
                    var value = kvc.Get(key.ToLower());
                    return value;
                }
                else
                    ret = null;
                return ret;
            }
            throw new EvaluationException(this.Pos, this.Length,
                new TypeMismatchError($"Function part didn't evaluate to a function or a list. {FuncScript.GetFsDataType(func)}"));


        }
        public override IList<ExpressionBlock> GetChilds()
        {
            var ret = new List<ExpressionBlock>();
            ret.Add(this.Function);
            ret.AddRange(this.Parameters);
            return ret;
        }
        public override string ToString()
        {
            return "function";
        }
        public override string AsExpString(IFsDataProvider provider)
        {
            string infix = null;
            if (this.Function is ReferenceBlock)
            {
                var f = provider.GetData(((ExpressionBlock)this.Function).ToString().ToLower()) as IFsFunction;
                if (f != null && f.CallType == CallType.Infix)
                {
                    infix = f.Symbol;
                }
            }
            else if (this.Function is LiteralBlock)
            {
                var f = ((LiteralBlock)this.Function).Value as IFsFunction;
                if (f != null && f.CallType == CallType.Infix)
                {
                    infix = f.Symbol;
                }
            }
            var sb = new StringBuilder();
            if (infix == null)
            {
                sb.Append(this.Function.AsExpString(provider));
                sb.Append("(");
                if (Parameters.Length > 0)
                {
                    sb.Append(this.Parameters[0].AsExpString(provider));
                    for (int i = 1; i < Parameters.Length; i++)
                    {
                        sb.Append(",");
                        sb.Append(this.Parameters[i].AsExpString(provider));
                    }
                }
                sb.Append(")");
            }
            else
            {
                if (Parameters.Length > 0)
                {
                    sb.Append(this.Parameters[0].AsExpString(provider));
                    for (int i = 1; i < Parameters.Length; i++)
                    {
                        sb.Append($" {infix} ");
                        sb.Append(this.Parameters[i].AsExpString(provider));
                    }
                }
            }
            return sb.ToString();
        }

    }
}
