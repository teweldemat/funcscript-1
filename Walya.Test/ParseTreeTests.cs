using global::Walya.Block;
using global::Walya.Core;
using global::Walya.Model;
using WalyaParser = global::Walya.Core.WalyaParser;
using ParseNode = global::Walya.Core.WalyaParser.ParseNode;
using NUnit.Framework;
using NUnit.Framework.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using static global::Walya.Core.WalyaParser;

namespace Walya.Test
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
            var list = new List<WalyaParser.SyntaxErrorData>();
            var exp= WalyaParser.Parse(g, expText,out var node,list);
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
            var errors = new List<WalyaParser.SyntaxErrorData>();
            var block = WalyaParser.Parse(provider, expText, out var node, errors);

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

            //check evaluation tree
            Assert.That(block, Is.TypeOf<FunctionCallExpression>());
            Assert.That(block.CodeLocation.Position, Is.EqualTo(0));
            Assert.That(block.CodeLocation.Length, Is.EqualTo(3));

            var function = (FunctionCallExpression)block;
            Assert.That(function.Function.CodeLocation.Position, Is.EqualTo(1));
            Assert.That(function.Function.CodeLocation.Length, Is.EqualTo(1));

            var leftExp = function.Parameters[0];
            Assert.That(leftExp.CodeLocation.Position, Is.EqualTo(0));
            Assert.That(leftExp.CodeLocation.Length, Is.EqualTo(1));

            var rightExp = function.Parameters[1];
            Assert.That(rightExp.CodeLocation.Position, Is.EqualTo(2));
            Assert.That(rightExp.CodeLocation.Length, Is.EqualTo(1));


        }
        void AssertTreeSpanConsitency(ParseNode node)
        {
            var left = node.Pos;
            foreach (var ch in node.Childs)
            {
                if (ch.Pos < left)
                    throw new AssertionException("Node ordering and position inconsitence.");
                AssertTreeSpanConsitency(ch);
                left = ch.Pos + ch.Length;
                if(left>node.Pos+node.Length)
                    throw new AssertionException($"Child node {node.NodeType} span overflow the span of its parent {node.NodeType}");
            }
        }
        [Test]
        public void TestColoring()
        {
            var provider = new DefaultFsDataProvider();
            var expText = "1+sin(45)";
            var errors = new List<WalyaParser.SyntaxErrorData>();
            var block = WalyaParser.Parse(provider, expText, out var node, errors);
            Assert.IsNotNull(block);
            Assert.IsNotNull(node);
            Assert.IsEmpty(errors);
            AssertTreeSpanConsitency(node);
            var color = WalyaRuntime.ColorParseTree(node).ToArray();
            Assert.That(color, Has.Length.EqualTo(6));

            var p = 0;
            var i = 0;
            var c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.LiteralInteger));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(1));
            p++;
            i++;

            c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.Operator));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(1));
            p += 1;
            i++;

            c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.Identifier));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(3));
            p += 3;
            i++;

            c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.FunctionParameterList));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(1));
            p++;
            i++;

            c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.LiteralInteger));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(2));
            p += 2;
            i++;

            c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.FunctionParameterList));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(1));
            p++;
            i++;
        }
        
        [Test]
        public void TestColoring2()
        {
            var provider = new DefaultFsDataProvider();
            var expText = "(x)=>45";
            var errors = new List<WalyaParser.SyntaxErrorData>();
            var block = WalyaParser.Parse(provider, expText, out var node, errors);
            Assert.IsNotNull(block);
            Assert.IsNotNull(node);
            Assert.IsEmpty(errors);
            AssertTreeSpanConsitency(node);
            var color = WalyaRuntime.ColorParseTree(node).ToArray();
            Assert.That(color, Has.Length.EqualTo(5));

            var p = 0;
            var i = 0;
            var c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.IdentiferList));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(1));
            p++;
            i++;

            c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.Identifier));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(1));
            p += 1;
            i++;
            
            c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.IdentiferList));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(1));
            p += 1;
            i++;

            c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.LambdaExpression));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(2));
            p+=2;
            i++;

            c = color[i];
            Assert.That(c.NodeType, Is.EqualTo(ParseNodeType.LiteralInteger));
            Assert.That(c.Pos, Is.EqualTo(p));
            Assert.That(c.Length, Is.EqualTo(2));
            p += 2;
            i++;
        
        }
    }
}
