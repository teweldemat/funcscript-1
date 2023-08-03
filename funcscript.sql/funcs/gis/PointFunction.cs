using funcscript.core;
using NetTopologySuite.Geometries;

namespace funcscript.sql.funcs.gis
{
    public class PointFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "point";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != this.MaxParsCount)
                throw new error.EvaluationTimeException($"{this.Symbol} function: invalid parameter count. {this.MaxParsCount} expected, got {pars.Count}");

            var x = Convert.ToDouble(pars[0]);
            var y = Convert.ToDouble(pars[1]);

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