using funcscript.core;
using funcscript.model;

namespace funcscript.funcs.math
{
    public class SubstractFunction : IFsFunction
    {
        public int MaxParsCount => -1;

        public CallType CallType => CallType.Infix;

        public string Symbol => "-";

        public int Precidence => 100;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            bool isInt = false, isLong = false, isDouble = false;
            int intTotal = 1;
            long longTotal = 1;
            double doubleTotal = 1;
            int count = pars.Count;

            if (count > 0)
            {
                var d = pars.GetParameter(parent, 0);
                if (d is ValueReferenceDelegate)
                    return CallRef.Create(parent, this, pars);
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
                else
                {
                    isInt = true;
                    intTotal = 0;
                }
            }

            for (int i = 1; i < count; i++)
            {
                var d = pars.GetParameter(parent, i);

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
                    }
                    else if (d is double)
                    {
                        isDouble = true;
                        doubleTotal = intTotal;
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

        public string ParName(int index)
        {
            return $"Op {index + 1}";
        }
    }
}
