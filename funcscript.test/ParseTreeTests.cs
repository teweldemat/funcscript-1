using funcscript.core;
using funcscript.model;
using NUnit.Framework;
using NUnit.Framework.Internal.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static funcscript.core.FuncScriptParser;

namespace funcscript.test
{
    internal class ParseTreeTests
    {
        static ParseNode Flatten(ParseNode node)
        {
            if(node.Childs.Count==1)
            {
                return node.Childs[0];
            }
            
            if(node.Childs.Count>1)
            {
                for (int i = 0; i < node.Childs.Count; i++)
                    node.Childs[i] = Flatten(node.Childs[i]);
            }
            return node;
        }
        [Test]
        public void PasreKvcTest()
        {
            var g = new DefaultFsDataProvider();
            var expText = "{a,b,c}";
            var list = new List<FuncScriptParser.SyntaxErrorData>();
            var exp= funcscript.core.FuncScriptParser.Parse(g, expText,out var node,list);
            Assert.IsNotNull(exp);
            Assert.IsNotNull(node);
            node = Flatten(node);
            Assert.AreEqual(Tuple.Create(ParseNodeType.KeyValueCollection,0,expText.Length), Tuple.Create(node.NodeType,node.Pos,node.Length));

        }
    }
}
