using System.Text;
using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

public class JsonFileStoreNode
{
    private object _source = null;
    private object _fileName = null;

    public ValueSinkDelegate In => val =>
    {
        this._source = val;
    };
    public ValueSinkDelegate FileName => val =>
    {
        this._fileName = val;
    };

    public SignalListenerDelegate Save => ()=>
    {
        string fileName=FuncScript.Dref(this._fileName) as string;
        if (fileName == null)
            throw new error.EvaluationTimeException($"{this.GetType()}: file name is not provided");
        string strFileName = fileName.ToString();
        
        object val=FuncScript.Dref(_source);

        string json;
        if (val == null)
            json = "null";
        else
        {
            var sb = new StringBuilder();
            FuncScript.Format(sb, val, asJsonLiteral: true);
            json = sb.ToString();
        }

        System.IO.File.WriteAllText(strFileName,json);
    };
    
    
}

public class CreateJsonFileStoreNodeFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        return new ObjectKvc(new JsonFileStoreNode());      
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