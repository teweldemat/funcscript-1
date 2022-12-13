namespace funcscript.error
{
    public class EvaluationException : Exception
    {
        public int Pos;
        public int Len;
        public EvaluationException(int i, int l, Exception innerException)
            :this(null,i,l, innerException)
        {

        }
        public EvaluationException(String message,int i, int l, Exception innerException)
            : base(message,innerException)
        {
            this.Pos = i;
            this.Len = l;
        
        }
        
    }
}