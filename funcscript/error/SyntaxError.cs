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
        public override string Message
        {
            get
            {
                
                if (data == null || data.Count == 0)
                    return "";
                var ret = data[0].Message;
                for(int i=1;i<data.Count;i++)
                    ret += "\n"+data[i].Message;
                return ret;

            }
        }

    }
}