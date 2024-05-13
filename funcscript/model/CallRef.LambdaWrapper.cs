using funcscript.core;

namespace funcscript.model;

public partial class CallRef
{
    public class LambdaWrapper : IFsFunction,IFsDref
    {
        private ExpressionFunction _exp;
        private IFsDataProvider _parent;
        public LambdaWrapper(IFsDataProvider parent, ExpressionFunction exp)
        {
            this._exp = exp;
            this._parent = parent;
        }

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            return _exp.Evaluate(_parent, pars);
        }

        public string ParName(int index) => _exp.ParName(index);

        public int MaxParsCount => _exp.MaxParsCount;
        public CallType CallType => _exp.CallType;
        public string Symbol => _exp.Symbol;
        public int Precidence => _exp.Precidence;
        public object DrefEvaluate(IParameterList pars)
        {
            var ret = _exp.Evaluate(_parent, pars);
            return FuncScript.Dref(ret);
        }
    }
}