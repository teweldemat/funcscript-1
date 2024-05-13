using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.math
{
    public class SubstractFunction : IFsFunction, IFsDref
    {
        public int MaxParsCount => -1;

        public CallType CallType => CallType.Infix;

        public string Symbol => "-";

        public int Precidence => 100;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            var parBuilder = new CallRefBuilder(this, parent, pars);
            var doRef = false;
            var ret = EvaluateInternal(pars, (i) =>
            {
                var ret = pars.GetParameter(parent, i);
                if (ret is ValueReferenceDelegate)
                {
                    doRef = true;
                    return (false, null);
                }
                return (true, ret);
            });
            if (doRef)
                return parBuilder.CreateRef();
            return ret;
        }

        object EvaluateInternal(IParameterList pars, Func<int, (bool, object)> getPar)
        {
            bool isInt = false, isLong = false, isDouble = false;
            int intTotal = 0;
            long longTotal = 0;
            double doubleTotal = 0;
            int count = pars.Count;

            if (count > 0)
            {
                var p = getPar(0);
                if (!p.Item1)
                    return null;
                var d = p.Item2;

                if (d is int)
                {
                    isInt = true;
                    intTotal = (int)d;
                }
                else if (d is long)
                {
                    isLong = true;
                    longTotal = (long)d;
                }
                else if (d is double)
                {
                    isDouble = true;
                    doubleTotal = (double)d;
                }
            }

            for (int i = 1; i < count; i++)
            {
                var p = getPar(i);
                if (!p.Item1)
                    return null;
                var d = p.Item2;

                if (isInt)
                {
                    if (d is int)
                    {
                        intTotal -= (int)d;
                    }
                    else if (d is long)
                    {
                        isLong = true;
                        longTotal = intTotal;
                        longTotal -= (long)d;
                    }
                    else if (d is double)
                    {
                        isDouble = true;
                        doubleTotal = intTotal;
                        doubleTotal -= (double)d;
                    }
                }

                if (isLong)
                {
                    if (d is int)
                    {
                        longTotal -= (long)(int)d;
                    }
                    else if (d is long)
                    {
                        longTotal -= (long)d;
                    }
                    else if (d is double)
                    {
                        isDouble = true;
                        doubleTotal = longTotal;
                        doubleTotal -= (double)d;
                    }
                }

                if (isDouble)
                {
                    if (d is int)
                    {
                        doubleTotal -= (double)(int)d;
                    }
                    else if (d is long)
                    {
                        doubleTotal -= (double)(long)d;
                    }
                    else if (d is double)
                    {
                        doubleTotal -= (double)d;
                    }
                }
            }

            if (isDouble)
                return doubleTotal;
            if (isLong)
                return longTotal;
            if (isInt)
                return intTotal;

            return null;
        }

        public object DrefEvaluate(IParameterList pars)
        {
            var ret = EvaluateInternal(pars, (i) =>
            {
                var ret = FuncScript.Dref(pars.GetParameter(null, i));
                return (true, ret);
            });
            return ret;
        }

        public string ParName(int index)
        {
            return $"Op {index + 1}";
        }
    }
}
