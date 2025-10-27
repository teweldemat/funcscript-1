using global::FuncScript.Core;
using NetTopologySuite.Geometries;

namespace FuncScript.Sql.funcs.gis
{
    public class PointFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "point";

        public int Precedence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new Error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected, got {pars.Count}");

            var x = Convert.ToDouble(pars.GetParameter(parent, 0));
            var y = Convert.ToDouble(pars.GetParameter(parent, 1));

            return new Point(x, y);
        }

        public string ParName(int index)
        {
            return index switch
            {
                0 => "X coordinate",
                1 => "Y coordinate",
                _ => "",
            };
        }
    }
}