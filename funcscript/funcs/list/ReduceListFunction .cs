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

        public CallType CallType => CallType.Dual;

        public string Symbol => "Reduce";

        public int Precidence => 0;
        class DoListFuncPar : IParameterList
        {
            public object S;
            public object X;
            public object I;

            public override int Count => 3;

            public override (object,CodeLocation) GetParameterWithLocation(IFsDataProvider provider, int index)
            {
                return index switch
                {
                    0 => (X,null),
                    1 => (S,null),
                    2 => (I,null),
                    _ => (null,null),
                };
            }
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var par0 = pars.GetParameter(parent,0);
            var par1 = pars.GetParameter(parent,1);
            var par2 = pars.GetParameter(parent,2);
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
            var par0 = FuncScript.Dref(pars.GetParameter(null, 0),false);
            var par1 = FuncScript.Dref(pars.GetParameter(null, 1),false);
            var par2 = FuncScript.Dref(pars.GetParameter(null, 2));
            return EvaluateInternal(null, par0, par1,par2,true);

        }
    }
}
