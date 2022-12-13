using funcscript.core;
using System.Runtime.Serialization;
using static funcscript.core.FuncScriptParser;

namespace funcscript.error
{
    public class EvaluationTimeException : Exception
    {
        public EvaluationTimeException(string message) : base(message)
        {
        }
    }
    public class SyntaxError : Exception
    {
        public List<FuncScriptParser.SyntaxErrorData> data;
        public SyntaxError(List<FuncScriptParser.SyntaxErrorData> data):base("Syntax error")
        {
            this.data= data;
        }
    }
}