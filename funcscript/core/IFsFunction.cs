using System.Text;

namespace funcscript.core
{
    public interface IFsFunction
    {
        object Evaluate(IFsDataProvider parent, IParameterList pars);
        String ParName(int index);
        int MaxParsCount { get; }
        CallType CallType { get; }
        String Symbol { get; }
        int Precidence { get; }
    }

    public interface IFsDref
    {
        public object DrefEvaluate(IParameterList pars);
    }

    public record CodeLocation(int Position,int Length)
    {
        static CodeLocation SpanTwo(CodeLocation l1, CodeLocation l2)
        {
            if (l1 == null)
                return l2;
            if (l2 == null)
                return l1;
            var pos = Math.Min(l1.Position,l2.Position);
            var max = Math.Min(l1.Position + l1.Length, l2.Position+l2.Length);
            return new CodeLocation(pos,max-pos);
        }
        public static CodeLocation Span(params CodeLocation [] locations)
        {
            CodeLocation total= null;
            foreach (var l in locations)
            {
                total = CodeLocation.SpanTwo(total, l);
            }

            return total;
        }
    }
    public abstract class IParameterList
    {
        public abstract int Count { get; }
        public object GetParameter(IFsDataProvider provider, int index)
        {
            var (ret, _) = GetParameterWithLocation(provider, index);
            return ret;
        }
        public abstract (object,CodeLocation) GetParameterWithLocation(IFsDataProvider provider, int index);
    }

    public enum CallType
    {
        Infix,
        Prefix
    }
}
