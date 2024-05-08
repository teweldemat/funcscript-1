using funcscript.core;
using funcscript.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.block
{
    internal class SelectorExpression: ExpressionBlock
    {
        class SelectorProvider: IFsDataProvider
        {
            public IFsDataProvider Provider;
            public SelectorExpression Parent;
            public object SourceVal
            {
                set
                {
                    _sourceVal = value as KeyValueCollection;
                }
            }
            KeyValueCollection _sourceVal;
            public object GetData(string name)
            {
                if (_sourceVal != null)
                {
                    if (_sourceVal.ContainsKey(name))
                        return _sourceVal.Get(name);
                }
                return Provider.GetData(name);

            }
        }
        public ExpressionBlock Source;
        public ExpressionBlock Selector;
        public override object Evaluate(IFsDataProvider provider)
        {
            var sourceVal = Source.Evaluate(provider);
            if (sourceVal is FsList)
            {
                var lst = (FsList)sourceVal;
                var ret = new object[lst.Length];
                int i = 0;
                var sel=new SelectorProvider
                {
                    Parent = this,
                    Provider = provider,
                };
                foreach (var l in lst.Data)
                {
                    sel.SourceVal = l;
                    ret[i++] = Selector.Evaluate(sel);
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
