using FuncScript.Core;
using FuncScript.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace FuncScript.Block
{
    internal class SelectorExpression: ExpressionBlock
    {
        class SelectorProvider: IFsDataProvider
        {
            public IFsDataProvider Provider;
            public SelectorExpression Parent;
            public IFsDataProvider ParentProvider => Provider;

            public object SourceVal
            {
                set
                {
                    _sourceVal = value as KeyValueCollection;
                }
            }
            KeyValueCollection _sourceVal;
            public object Get(string name)
            {
                if (_sourceVal != null)
                {
                    if (_sourceVal.IsDefined(name))
                        return _sourceVal.Get(name);
                }
                return Provider.Get(name);
            }
            public bool IsDefined(string key)
            {
                if (_sourceVal != null)
                {
                    if (_sourceVal.IsDefined(key))
                        return true;
                }

                return Provider.IsDefined(key);
            }

        }
        public ExpressionBlock Source;
        public KvcExpression Selector;
        public override object Evaluate(IFsDataProvider provider)
        {
            var sourceVal = Source.Evaluate(provider);
            if (sourceVal is FsList)
            {
                var lst = (FsList)sourceVal;
                var ret = new object[lst.Length];
                int i = 0;
                
                foreach (var l in lst)
                {
                    var sel=new SelectorProvider
                    {
                        Parent = this,
                        Provider = provider,
                        SourceVal = l
                    };
                    ret[i] = Selector.Evaluate(sel);
                    i++;
                }
                return new ArrayFsList(ret);

            }
            else
            {
                return Selector.Evaluate(new SelectorProvider
                {
                    Parent = this,
                    Provider = provider,
                    SourceVal=sourceVal
                });
            }
        }

        public override IList<ExpressionBlock> GetChilds()
        {
            return new ExpressionBlock[] { Source, Selector };
        }
        public override string ToString()
        {
            return "selector";
        }
        public override string AsExpString(IFsDataProvider provider)
        {
            return $"{Source.AsExpString(provider)} {Selector.AsExpString(provider)}";
        }
    }
}
