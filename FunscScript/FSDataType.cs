using Microsoft.VisualBasic;
using System.Security.Cryptography;

namespace FunscScript
{
    /// <summary>
    /// FunscScript data types
    /// </summary>
    public enum FSDataType
    {
        Null,
        Boolean,
        Integer,
        BigInteger,
        DateTime,
        Guid,
        Float,
        String,
        ByteArray,
        List,
        KeyValueCollection,
        Function,
        ValRef,
        ValSink,
        SigSource,
        SigSink,
        Error
    }
}
