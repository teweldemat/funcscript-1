using System.Runtime.InteropServices;
using funcscript.core;
using funcscript.error;
using funcscript.model;
using System.Text;

namespace funcscript.block
{
    public class FunctionCallExpression : ExpressionBlock
    {
        public ExpressionBlock Function;
        public ExpressionBlock[] Parameters;

        
        class FuncParameterList : IParameterList
        {
            public FunctionCallExpression parent;
            public override int Count => parent.Parameters.Length;
            public override (object,CodeLocation) GetParameterWithLocation(IFsDataProvider provider, int index)
            {
                var ret = index < 0 || index >= parent.Parameters.Length ? null : parent.Parameters[index].Evaluate(provider);
                if (ret == null)
                    return (null, null);
                return (ret,parent.Parameters[index].CodeLocation);
            }
        }


        public int Count => Parameters.Length;

        
        public override object Evaluate(IFsDataProvider provider)
        {

            var func = Function.Evaluate(provider);
            var paramList=new FuncParameterList
            {
                parent = this,
            };
            if (func is IFsFunction)
            {
                string fn = null;
                
                try
                {
                   
                    var ret = ((IFsFunction)func).Evaluate(provider, paramList);
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
                var index = paramList.GetParameter(provider, 0);
                object ret;
                if (index is int)
                {
                    var i = (int)index;
                    var lst = (FsList)func;
                    if (i < 0 || i >= lst.Length)
                        ret = null;
                    else
                        ret = lst[i];
                }
                else
                    ret = null;
                return ret;
            }
            else if (func is KeyValueCollection collection)
            {
                var index = paramList.GetParameter(provider, 0);

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
                var f = provider.Get(((ExpressionBlock)this.Function).ToString().ToLower()) as IFsFunction;
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
