using System;
using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

public class TextFileNode:ObjectKvc, SignalListenerDelegate
{
    private object _text = null;
    private object _fileName = null;

    public TextFileNode() => base.SetVal(this);
    public ValueSinkDelegate TextIn =>new ValSink(val =>
    {
        this._text = val;
    });

    public ValueSinkDelegate FileName =>new ValSink(val =>
    {
        this._fileName = val;
    });


    public void Activate()
    {
        string fileName=FuncScript.Dref(this._fileName) as string;

        if (fileName == null)
            throw new error.EvaluationTimeException($"{this.GetType()}: file name is not provided");
        object text=FuncScript.Dref(_text);
        string strText = text?.ToString() ?? "";

        System.IO.File.WriteAllText(fileName, strText);
    }
}

public class CreateTextFileNodeFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        var ret = new TextFileNode();
        if (pars.Count > 0)
        {
            ret.FileName.SetValueSource(pars.GetParameter(parent,0));
        }
        if (pars.Count > 1)
        {
            ret.TextIn.SetValueSource(pars.GetParameter(parent,1));
        }
        return ret;
    }

    public string ParName(int index) => null;

    public int MaxParsCount => 0;
    public CallType CallType => CallType.Prefix;
    public string Symbol => "TextFile";
    public int Precidence => 0;
}