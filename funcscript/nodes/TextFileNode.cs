using System;
using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

public class TextFileNode
{
    private object _text = null;
    private object _fileName = null;

    public ValueSinkDelegate TextIn => val =>
    {
        this._text = val;
    };

    public ValueSinkDelegate FileName => val =>
    {
        this._fileName = val;
    };

    public SignalListenerDelegate Save => () =>
    {
        string fileName=FuncScript.Dref(this._fileName) as string;

        if (fileName == null)
            throw new error.EvaluationTimeException($"{this.GetType()}: file name is not provided");
        object text=FuncScript.Dref(_text);
        string strText = text?.ToString() ?? "";

        System.IO.File.WriteAllText(fileName, strText);
    };
}

public class CreateTextFileNodeFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        return new ObjectKvc(new TextFileNode());
    }

    public string ParName(int index) => null;

    public int MaxParsCount => 0;
    public CallType CallType => CallType.Prefix;
    public string Symbol => "TextFileStore";
    public int Precidence => 0;
}