using funcscript.core;
using funcscript.model;
using System.Text;

namespace funcscript.funcs.text
{
    public class JoinTextFunction : IFsFunction, IFsDref
    {
        public const string SYMBOL = "join";
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => SYMBOL;

        public int Precidence => 100;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: Two parameters expected");

            var parBuilder = new CallRefBuilder(this,parent, pars);
            var par0 = parBuilder.GetParameter(0);
            var par1 = parBuilder.GetParameter(1);

            if (par0 is ValueReferenceDelegate || par1 is ValueReferenceDelegate)
                return parBuilder.CreateRef();

            if (par0 == null || par1 == null)
                throw new funcscript.error.TypeMismatchError($"{this.Symbol}: List and separator expected as parameters");
            if(!(par0 is FsList list))
               throw new InvalidOperationException($"{this.Symbol}: first parameter should be list");
            if(!(par1 is string separator))
                throw new InvalidOperationException($"{this.Symbol}: second parameter should be string");
            
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < list.Length; i++)
            {
                var item = list[i];
                if (item is ValueReferenceDelegate)
                    return parBuilder.CreateRef();
                if (item != null)
                {
                    if (i > 0)
                        sb.Append(separator);
                    sb.Append(item?? "");
                }
            }
            return sb.ToString();
        }

        

        public object DrefEvaluate(IParameterList pars)
        {
            var list = FuncScript.Dref(pars.GetParameter(null, 0),false) as FsList;
            var separator = FuncScript.Dref(pars.GetParameter(null, 1),false) as string;

            if (list == null || separator == null)
                throw new funcscript.error.TypeMismatchError($"{Symbol}: List and separator expected as parameters");

            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < list.Length; i++)
            {
                var item = list[i];
                if (item != null)
                {
                    if (i > 0)
                        sb.Append(separator);
                    sb.Append(FuncScript.Dref(item,false) ?? "");
                }
            }
            return sb.ToString();
        }

        public string ParName(int index)
        {
            return index switch
            {
                0 => "List",
                1 => "Separator",
                _ => ""
            };
        }
    }
}
