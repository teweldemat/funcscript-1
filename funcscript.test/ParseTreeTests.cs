using funcscript.block;
using funcscript.core;
using funcscript.model;
using NUnit.Framework;
using NUnit.Framework.Internal.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
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

        [Test]
        public void ParseSimpleInfixExpressionPositions()
        {
            var provider = new DefaultFsDataProvider();
            var expText = "1+2";
            var errors = new List<FuncScriptParser.SyntaxErrorData>();
            var block = funcscript.core.FuncScriptParser.Parse(provider, expText, out var node, errors);

            Assert.IsNotNull(block, "Expression should be parsed into a block instance");
            Assert.IsNotNull(node, "Parse node is expected for valid expression");
            Assert.IsEmpty(errors, "No syntax errors should be reported for a simple expression");

            //check parse node tree
            Assert.AreEqual(ParseNodeType.InfixExpression, node.NodeType, "Root node should represent an infix expression");
            Assert.AreEqual(0, node.Pos, "Infix expression should start at the beginning of the expression");
            Assert.AreEqual(expText.Length, node.Length, "Infix expression span should cover the full expression text");

            Assert.AreEqual(3, node.Childs.Count);

            var left = node.Childs[0];
            Assert.AreEqual(ParseNodeType.LiteralInteger, left.NodeType);
            Assert.AreEqual(0, left.Pos);
            Assert.AreEqual(1, left.Length);

            var op = node.Childs[1];
            Assert.AreEqual(ParseNodeType.Operator, op.NodeType);
            Assert.AreEqual(1, op.Pos);
            Assert.AreEqual(1, op.Length);

            var right = node.Childs[2];
            Assert.AreEqual(ParseNodeType.LiteralInteger, right.NodeType);
            Assert.AreEqual(2, right.Pos);
            Assert.AreEqual(1, right.Length);

            //check evaluateion tree
            Assert.That(block, Is.TypeOf<FunctionCallExpression>());
            Assert.That(block.CodeLocation.Position, Is.EqualTo(0));
            Assert.That(block.CodeLocation.Length, Is.EqualTo(3));

            var function = (FunctionCallExpression)block;
            Assert.That(function.Function.CodeLocation.Position, Is.EqualTo(1));
            Assert.That(function.Function.CodeLocation.Length, Is.EqualTo(1));

            var leftExp = function.Parameters[0];
            Assert.That(leftExp.CodeLocation.Position, Is.EqualTo(0));
            Assert.That(leftExp.CodeLocation.Length, Is.EqualTo(1));

            var rightExp =function.Parameters[0];
            Assert.That(rightExp.CodeLocation.Position, Is.EqualTo(2));
            Assert.That(rightExp.CodeLocation.Length, Is.EqualTo(1));


        }
    }
}
