using funcscript.core;
using funcscript.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.list
{
    public class ReduceListFunction : IFsFunction,IFsDref
    {
        public int MaxParsCount => 3;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Reduce";

        public int Precidence => 0;
        class DoListFuncPar : IParameterList
        {
            public object S;
            public object X;
            public object I;

            public int Count => 3;

            public object GetParameter(IFsDataProvider provider, int index)
            {
                return index switch
                {
                    0 => X,
                    1 => S,
                    2 => I,
                    _ => null,
                };
            }
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var parBuilder = new CallRefBuilder(this,parent, pars);

            var par0 = parBuilder.GetParameter(0);
            if (par0 is ValueReferenceDelegate)
                return parBuilder.CreateRef();
            

            var par1 = parBuilder.GetParameter(1);
            if (par1 is ValueReferenceDelegate)
                return parBuilder.CreateRef();
 
            var par2 = parBuilder.GetParameter(2);
            if (par2 is ValueReferenceDelegate)
                return parBuilder.CreateRef();

            return EvaluateInternal(parent, par0, par1, par2,false);
        }

        private object EvaluateInternal(IFsDataProvider parent, object par0, object par1, object par2,bool dref)
        {
            if (par0 == null)
                return null;

            if (!(par0 is FsList))
                throw new error.TypeMismatchError($"{this.Symbol} function: The first parameter should be {this.ParName(0)}");

            var func = par1 as IFsFunction;

            if (func == null)
                throw new error.TypeMismatchError($"{this.Symbol} function: The second parameter didn't evaluate to a function");


            var total = par2;

            
            var lst = (FsList)par0;

            for (int i = 0; i < lst.Length; i++)
            {
                if (dref)
                {
                    if (func is IFsDref dreff)
                    {
                        total = dreff.DrefEvaluate(new DoListFuncPar { S = total, X = lst[i], I = i });
                    }
                    else
                    {
                        throw new InvalidOperationException($"{func.GetType()} doesn't implement IFsDref");
                    }
                }
                else
                    total = func.Evaluate(parent, new DoListFuncPar { S = total, X = lst[i], I = i });
            }

            return FuncScript.NormalizeDataType(total);
        }

        public string ParName(int index)
        {
            switch(index)
            {
                case 0:
                    return "List";
                case 1:
                    return "Transform Function";
                default:
                    return "";
            }
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var par0 = FuncScript.Dref(pars.GetParameter(null, 0));
            var par1 = FuncScript.Dref(pars.GetParameter(null, 1));
            var par2 = FuncScript.Dref(pars.GetParameter(null, 2));
            return EvaluateInternal(null, par0, par1,par2,true);

        }
    }
}
