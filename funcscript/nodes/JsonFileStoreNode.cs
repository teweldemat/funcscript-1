using System.Text;
using funcscript.model;

namespace funcscript.nodes;

public class JsonFileStoreNode:ObjectKvc
{
    private object _source = null;
    private object _fileName = null;
    public JsonFileStoreNode() => base.SetVal(this);
    public ValueSinkDelegate Data =>new ValDel( val =>
    {
        this._source = val;
    });
    public ValueSinkDelegate FileName =>new ValDel( val =>
    {
        this._fileName = val;
    });

    public SignalListenerDelegate Save => new SigSink(()=>
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
    });
    
    
}