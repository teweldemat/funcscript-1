using funcscript.core;
using funcscript.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.funcs.keyvalue
{
    internal class KvSelectFunction : IFsFunction
    {
        public int MaxParsCount => 2;

        public CallType CallType => CallType.Prefix;

        public string Symbol => "Select";

        public int Precidence => 0;

        public object Evaluate(IFsDataProvider parent, IParameterList pars)
        {
            if (pars.Count != MaxParsCount)
                throw new error.TypeMismatchError($"{Symbol} function: invalid parameter count. {MaxParsCount} expected got {pars.Count}");
            var par0 = pars[0];
            var par1 = pars[1];
            if (!(par0 is KeyValueCollection))
                throw new error.TypeMismatchError($"{Symbol} function: first paramter should be {ParName(0)}");
            if (!(par1 is KeyValueCollection))
                throw new error.TypeMismatchError($"{Symbol} function: second paramter should be {ParName(1)}");
            var first=((KeyValueCollection)par0);
            
            var second= ((KeyValueCollection)par1).GetAll();
            for(int i=0;i<second.Count;i++)
            {
                if (second[i].Value == null)
                    second[i]=KeyValuePair.Create(second[i].Key,first.Get(second[i].Key.ToLower()));
            }    

            return new SimpleKeyValueCollection(second.ToArray());
        }

        public string ParName(int index)
        {
            switch (index)
            {
                case 0: return "Source KVC";
                case 1: return "Target KVC";
            }
            return null;
        }
    }
}
