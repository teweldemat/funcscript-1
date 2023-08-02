using System.Data.SqlTypes;

namespace funcscript.sql
{
    internal class FuncScriptSql
    {
        internal static object? NormalizeDataType(object obj)
        {
            return obj switch
            {
                DBNull => null,
                SqlBinary sqlBinary => sqlBinary.Value,
                SqlBoolean sqlBoolean => sqlBoolean.Value,
                SqlDateTime sqlDateTime => sqlDateTime.Value,
                SqlDecimal sqlDecimal => sqlDecimal.Value,
                SqlDouble sqlDouble => sqlDouble.Value,
                SqlGuid sqlGuid => sqlGuid.Value,
                SqlInt16 sqlInt16 => sqlInt16.Value,
                SqlInt32 sqlInt32 => sqlInt32.Value,
                SqlInt64 sqlInt64 => sqlInt64.Value,
                SqlSingle sqlSingle => sqlSingle.Value,
                SqlString sqlString => sqlString.Value,
                SqlMoney sqlMoney => sqlMoney.Value,
                _ => obj,
            };
        }

    }
}
