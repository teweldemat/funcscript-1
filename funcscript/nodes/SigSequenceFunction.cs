using System.Data;
using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

public class SigSequenceFunction:IFsFunction
{
    public class SigSequenceNode
    {
        public Item[] Items;

        public class Item
        {
            public SignalListenerDelegate Sink;
            public SignalListenerDelegate Catch;
        }

        public SignalListenerDelegate Listner => ()=>
        {
            if(Items==null || Items.Length==0)
                return;
            foreach (var item in Items)
            {
                try
                {
                    if (item.Sink != null)
                        item.Sink();
                }
                catch (Exception exception)
                {
                    if(item.Catch!=null)
                    {
                        item.Catch();
                    }
                    else
                        throw;
                }
            }
        };
}
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        var c = pars.Count;
        var parVals = new object[c];
        for(int i=0;i<c;i++)
        {
            parVals[i] = pars.GetParameter(parent,i);
        }

        if (parVals.Any(x => x is ValueReferenceDelegate))
        {
            return FunctionRef.Create(parent, this, pars);
        }

        return new SigSequenceNode()
        {
            Items = parVals.Select(p =>
            {
                if (p is SignalListenerDelegate s)
                    return new SigSequenceNode.Item
                    {
                        Sink = s,
                        Catch = null
                    };
                if (p is FsList l)
                {
                    if (l.Length != 2)
                        throw new EvaluateException("Exactly two values:normal signal, and error signal are expected");
                    return new SigSequenceNode.Item
                    {
                        Sink = l[0] as SignalListenerDelegate,
                        Catch = l[1] as SignalListenerDelegate
                    };
                }

                return new SigSequenceNode.Item
                {
                    Sink = null,
                    Catch = null
                };
            }).ToArray()
        }.Listner;
    }

    public string ParName(int index)
    {
        return $"Expression {index+1}";
    }

    public int MaxParsCount => -1;
    public CallType CallType => CallType.Prefix;
    
    public const string SYMBOL = "SigSequence";
    public string Symbol => SYMBOL;
    public int Precidence => 0;
}