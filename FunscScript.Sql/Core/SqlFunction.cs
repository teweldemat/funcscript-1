using global::FunscScript.Core;
using global::FunscScript.Model;
using System.Data.SqlClient;

namespace FunscScript.Sql.Core
{
    public class SqlFunction : IFsFunction
    {
        public int MaxParsCount => 3;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "sql";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.GetParameter(parent, 0) is not string connectionStr)
                throw new InvalidOperationException($"{Symbol} - {ParName(0)} is required");

            if (pars.GetParameter(parent, 1) is not string query)
                throw new InvalidOperationException($"{Symbol} - {ParName(1)} is required");

            using var conn = new SqlConnection(connectionStr);
            conn.Open();

            using var cmd = new SqlCommand(query, conn);
            cmd.CommandTimeout = 0;

            if (pars.Count > 2 && pars.GetParameter(parent, 2) is not null)
            {
                cmd.Parameters.AddWithValue("@param", pars.GetParameter(parent, 2));
            }

            using var reader = cmd.ExecuteReader();
            var results = new List<SimpleKeyValueCollection>();
            while (reader.Read())
            {
                var row = new List<KeyValuePair<string, object?>>();
                for (var i = 0; i < reader.FieldCount; i++)
                {
                    var value = FunscScriptSql.NormalizeDataType(reader.GetValue(i));
                    row.Add(new KeyValuePair<string, object?>(reader.GetName(i), value));
                }
                results.Add(new SimpleKeyValueCollection(null,row.ToArray()));
            }

            var normalizedResults = FunscScriptRuntime.NormalizeDataType(results);
            return normalizedResults ?? "null";
        }

        public string? ParName(int index)
        {
            return index switch
            {
                0 => "ConnectionString",
                1 => "Query",
                2 => "QueryParam",
                _ => null,
            };
        }
    }
}
