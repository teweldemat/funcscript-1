using FunscScript.Core;
using FunscScript.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FunscScript.Functions.Misc
{
    public abstract class Fslogger
    {
        public abstract void WriteLine(string text);
        public abstract void Clear();
        
        
        private static Fslogger _fslogger;

        public static void SetDefaultLogger(Fslogger logger)
        {
            _fslogger = logger;
        }
        public static Fslogger DefaultLogger =>_fslogger;

        static Fslogger()
        {
            SetDefaultLogger(new ConsoleLogger());
        }
    }

    public class ConsoleLogger : Fslogger
    {
        public override void WriteLine(string text) => Console.WriteLine(text);
        public override void Clear() => Console.Clear();
    }
    public class LogFunction : IFsFunction
    {
        
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Infix;

        public string Symbol => "log";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count == 0)
                throw new Error.EvaluationTimeException($"{this.Symbol} function: {this.ParName(0)} expected");

            var tag = pars.Count > 1 ? $"({pars.GetParameter(parent, 1).ToString()})" : "";
            var output = pars.Count > 2 ? (pars.GetParameter(parent, 2) is bool ? (bool)pars.GetParameter(parent, 2) : false) : true;
            Fslogger.DefaultLogger.WriteLine($"FunscScript: Evaluating {tag}");
            try
            {
                var res = pars.GetParameter(parent, 0);
                if (output)
                {
                    Fslogger.DefaultLogger.WriteLine($"FunscScript: Result{tag}:\n{(res == null ? "<null>" : res.ToString())}");
                    Fslogger.DefaultLogger.WriteLine($"End Result {tag}");
                }
                else
                    Fslogger.DefaultLogger.WriteLine($"Done {tag}");
                return res;
            }
            catch (Exception ex)
            {
                Fslogger.DefaultLogger.WriteLine($"FunscScript: Error evaluating {tag}");
                var thisEx = ex;
                while (thisEx != null)
                {
                    Fslogger.DefaultLogger.WriteLine(thisEx.Message);
                    Fslogger.DefaultLogger.WriteLine(thisEx.StackTrace);
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
