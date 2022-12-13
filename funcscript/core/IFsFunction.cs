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
    
    public interface IParameterList
    {
        int Count { get; }
        object this[int index] { get; }
    }

    public enum CallType
    {
        Infix,
        Prefix
    }
}
