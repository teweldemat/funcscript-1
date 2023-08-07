using funcscript.core;
using funcscript.model;
using System.Data.SqlClient;

namespace funcscript.sql.core
{
    public class SqlFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "sql";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars[0] is not string connectionStr)
                throw new InvalidOperationException($"{Symbol} - {ParName(0)} is required");

            if (pars[1] is not string query)
                throw new InvalidOperationException($"{Symbol} - {ParName(1)} is required");

            using var conn = new SqlConnection(connectionStr);
            conn.Open();
            using var cmd = new SqlCommand(query, conn);
            cmd.CommandTimeout = 0;
            using var reader = cmd.ExecuteReader();
            var results = new List<SimpleKeyValueCollection>();
            while (reader.Read())
            {
                var row = new List<KeyValuePair<string, object?>>();
                for (var i = 0; i < reader.FieldCount; i++)
                {
                    var value = FuncScriptSql.NormalizeDataType(reader.GetValue(i));
                    row.Add(new KeyValuePair<string, object?>(reader.GetName(i), value));
                }
                results.Add(new SimpleKeyValueCollection(row.ToArray()));
            }

            var normalizedResults = FuncScript.NormalizeDataType(results);
            return normalizedResults ?? "null";
        }

        public string? ParName(int index)
        {
            return index switch
            {
                0 => "ConnectionString",
                1 => "Query",
                _ => null,
            };
        }
    }
}
