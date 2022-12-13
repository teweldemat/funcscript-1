using funcscript.core;
using funcscript.funcs.logic;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.model
{
    internal class ByteArray 
    {
        public byte[] Bytes;
    }

    internal class DelegateFunction : IFsFunction
    {
        private Delegate f;
        System.Reflection.ParameterInfo[] _pars;
        public DelegateFunction(Delegate f)
        {
            this.f = f;
            var m = f.Method;
            if (m.ReturnType == typeof(void))
                throw new error.TypeMismatchError("Delegate with no return is not supported");
            _pars = m.GetParameters();
            foreach(var p in _pars)
            {
                if(p.IsOut)
                    throw new error.TypeMismatchError($"Delegate with output parameters not supported. Par:{p.Name}");
            }
        }

        public int MaxParsCount => _pars.Length;

        public CallType CallType => CallType.Infix;

        public string Symbol => throw new NotSupportedException();

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            return this.f.DynamicInvoke(Enumerable.Range(0, pars.Count).Select(x => pars[x]).ToArray());
        }

        public string ParName(int index)
        {
            throw new NotImplementedException();
        }
    }
}
