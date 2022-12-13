using System.Runtime.Serialization;

namespace funcscript.error
{
    [Serializable]
    public class TypeMismatchError : Exception
    {
        public TypeMismatchError()
        {
        }

        public TypeMismatchError(string message) : base(message)
        {
        }

        public TypeMismatchError(string message, Exception innerException) : base(message, innerException)
        {
        }

        protected TypeMismatchError(SerializationInfo info, StreamingContext context) : base(info, context)
        {
        }
    }
}