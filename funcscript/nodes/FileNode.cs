using funcscript.core;

namespace funcscript.nodes;

public class CreateJsonFileStoreNodeFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        var ret =  new JsonFileStoreNode();
        if (pars.Count > 0)
        {
            ret.FileName.SetValueSource(pars.GetParameter(parent,0));
        }
        if (pars.Count > 1)
        {
            ret.Data.SetValueSource(pars.GetParameter(parent,1));
        }
        return ret;
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