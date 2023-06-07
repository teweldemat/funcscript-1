using funcscript.core;
using funcscript.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.misc
{
    public class LogFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => "log";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count ==0)
                throw new error.EvaluationTimeException($"{this.Symbol} function: {this.ParName(0)} expected");
            
            var tag = pars.Count >= 1 ? $"({pars[1].ToString()})": "";
            Console.WriteLine($"FuncScript: Evaluating {tag}");
            try
            {
                var res = pars[0];
                Console.WriteLine($"FuncScript: Result{tag}:\n{(res==null?"<null>":res.ToString())}");
                Console.WriteLine($"End Result{tag}");
                return res;
            }
            catch(Exception ex) 
            {
                Console.WriteLine($"FuncScript: Error evaluating {tag}");
                var thisEx = ex;
                while(thisEx != null)
                {
                    Console.WriteLine(thisEx.Message);
                    Console.WriteLine(thisEx.StackTrace);
                    thisEx = thisEx.InnerException;
                }
                throw;
            }

        }


        public string ParName(int index)
        {
            switch(index)
            {
                case 0: return "expression";
                case 1: return "tag";
                case 2: return "output";
                default:return null;
            }
        }
    }
}
