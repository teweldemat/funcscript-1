using System.Data;
using System.Text;
using funcscript.core;
using funcscript.error;
using funcscript.model;

namespace funcscript.nodes
{
    public class AnySignalNode :ObjectKvc, SignalSourceDelegate
    {
        private readonly SignalSinkInfo _sink = new SignalSinkInfo();
        private readonly SignalSinkInfo _fail = new SignalSinkInfo();
        void Fire() => _sink.Signal();
        void Catcher() => _fail.Signal();
        public AnySignalNode() => base.SetVal(this);
        public AnySignalNode(IEnumerable<SignalSourceDelegate> sources)
        {
            foreach (var source in sources)
            {
                source.SetSource(Fire, Catcher);
            }
        }
        public void SetSource(object listener, object catcher)
        {
            _sink.SetSink(listener, catcher);
        }
    }

    public class AnySignalFunction : IFsFunction, IFsDref
    {
        const string SYMBOL = "AnySignal";
        public string Symbol => SYMBOL;
        public int MaxParsCount => 1;
        public CallType CallType => CallType.Prefix;
        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var parBuilder = new CallRefBuilder(this, parent, pars);
            var par0 = parBuilder.GetParameter(0);
            if (par0 is ValueReferenceDelegate)
                return parBuilder.CreateRef();

            if (!(par0 is FsList list))
                throw new TypeMismatchError(
                    $"List of signal sinks expected, found {(par0 == null ? "null" : par0.GetType().ToString())}.");
            return CreateAnySignalNode(list);
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var list = FuncScript.Dref(pars.GetParameter(null, 0)) as FsList;
            return CreateAnySignalNode(list);
        }

        private object CreateAnySignalNode(FsList list)
        {
            return new AnySignalNode(list.Select(l =>
            {
                if (l is SignalSourceDelegate src)
                {
                    return src;
                }
                else
                {
                    throw new TypeMismatchError("All sources should be signal sources");
                }
            }));
        }

        public string ParName(int index)
        {
            return $"Expression {index + 1}";
        }
    }
}