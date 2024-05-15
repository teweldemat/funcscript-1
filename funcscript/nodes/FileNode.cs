using funcscript.core;

namespace funcscript.nodes;

public class CreateJsonFileStoreNodeFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        return new JsonFileStoreNode();      
    }

    public string ParName(int index)
    {
        return null;
    }

    public int MaxParsCount => 0;
    public CallType CallType => CallType.Prefix;
    public string Symbol => "JsonFileStore";
    public int Precidence => 0;
}