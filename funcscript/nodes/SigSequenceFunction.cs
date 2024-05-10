using System.Data;
using System.Text;
using funcscript.core;
using funcscript.error;
using funcscript.model;

namespace funcscript.nodes;

public class SigSequenceFunction:IFsFunction
{
    public class SigSequenceNode
    {
        public Item[] Items;

        public class Item
        {
            public object Sink;
            public object Catch;
        }

        public SignalListenerDelegate Listner => ()=>
        {
            if(Items==null || Items.Length==0)
                return;
            foreach (var item in Items)
            {
                try
                {
                    if (FuncScript.Dref(item.Sink) is SignalListenerDelegate s)
                        s();
                }
                catch (Exception ex)
                {
                    if (FuncScript.Dref(item.Catch) is SignalListenerDelegate s)
                    {
                        var x = ex;
                        var sb = new StringBuilder();
                        while (x!=null)
                        {
                            if (sb.Length > 0)
                                sb.Append("\n");
                            sb.Append(x.Message+"\n"+ex.StackTrace);
                            x = x.InnerException;
                        }
                        SignalSinkInfo.ThreadErrorObjects[System.Threading.Thread.CurrentThread.ManagedThreadId] = new ObjectKvc(
                            new SignalSinkInfo.ErrorObject()
                            {
                                Message = sb.ToString(),
                                ErrorType = ex.GetType().ToString(),
                            });
                        s();
                        SignalSinkInfo.ThreadErrorObjects.TryRemove(System.Threading.Thread.CurrentThread.ManagedThreadId, out _);
                    }
                    else
                    {
                        Console.WriteLine($"Unhandled: {ex.Message}");
                        throw;
                    }
                }
            }
        };
}
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        var par0 = pars.GetParameter(parent, 0);
        if (par0 is ValueReferenceDelegate)
        {
            var r= CallRef.Create(parent, this, pars);
            return r;
        }
        var list = par0 as FsList;
        if (list == null)
            throw new TypeMismatchError($"List of signal sinks expected found {(par0==null?"null":par0.GetType().ToString())} found");

        var c = list.Length;
        var parVals = new object[c];
        for(int i=0;i<c;i++)
        {
            parVals[i] = list[i];
        }

       
        return new SigSequenceNode()
        {
            Items = parVals.Select(p =>
            {
                if (p is FsList l)
                {
                    if (l.Length != 2)
                        throw new EvaluateException("Exactly two values:normal signal, and error signal are expected");
                    return new SigSequenceNode.Item
                    {
                        Sink = l[0],
                        Catch = l[1]
                    };
                }
                
                return new SigSequenceNode.Item
                {
                    Sink = p,
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