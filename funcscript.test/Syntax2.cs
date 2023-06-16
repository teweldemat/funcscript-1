using funcscript.model;
using Microsoft.VisualBasic;
using NuGet.Frameworks;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.test
{
    public class Syntax2
    {

        [Test]
        public void StringInterpolationBasic()
        {
            var p = new KvcProvider(new ObjectKvc(new{x = 100}),
                new DefaultFsDataProvider());
            var res = FuncScript.Evaluate(p, @"f'y={x+2}'");
            Assert.AreEqual("y=102", res);
        }


        [Test]
        public void StringInterpolationEscape()
        {
            var p = new KvcProvider(new ObjectKvc(new { x = 100 }),
                new DefaultFsDataProvider());
            var res = FuncScript.Evaluate(p, @"f'y=\{x+2}'");
            Assert.AreEqual(@"y={x+2}", res);
        }

        [Test]
        public void NullSafeGetMemberNullValue()
        {
            var p = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(p, @"x?.y");
            Assert.AreEqual(null, res);
        }

        [Test]
        public void NullSafeGetMemberNoneNullValue()
        {
            var p = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(p, @"{ x:{y:5}; return x?.y}");
            Assert.AreEqual(5, res);
        }

        [Test]
        public void NullSafeExpressionNullValue()
        {
            var p = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(p, @"x?!(x*200)");
            Assert.AreEqual(null, res);
        }


        

        [Test]
        public void NullSafeExpressionNoneNullValue()
        {
            var p = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(p, @"{ x:5; return x?!(x*200)}");
            Assert.AreEqual(1000, res);
        }

        [Test]
        public void SquareBraceIndexLiteral()
        {
            var p = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(p, @"[4,5,6][1]");
            Assert.AreEqual(5, res);
        }
        [Test]
        public void EmptyParameterList()
        {
            var exp = @"{y:()=>5;return y()}";
            var p = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(p, exp);
            Assert.AreEqual(5, res);
        }

        [Test]
        public void SquareBraceIndexVariable()
        {
            var p = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(p, @"{x:[4,5,6];return x[1]}");
            Assert.AreEqual(5, res);
        }

        [Test]
        public void TestFSTemplate1()
        {
            var template = "abc";
            var expeced = "abc";
            var res = FuncScript.Evaluate(template, new DefaultFsDataProvider(), null, FuncScript.ParseMode.FsTemplate);
            Assert.That(res, Is.EqualTo(expeced));
        }

        [Test]
        public void TestFSTemplate2()
        {
            var template = "abc${'1'}";
            var expeced = "abc1";
            var res = FuncScript.Evaluate(template, new DefaultFsDataProvider(), null, FuncScript.ParseMode.FsTemplate);
            Assert.That(res, Is.EqualTo(expeced));
        }
        [Test]
        public void TestFSTemplate3()
        {
            var template = "abc${['d',1,['e',2]]}f";
            var expeced = "abcd1e2f";
            var res = FuncScript.Evaluate(template, new DefaultFsDataProvider(), null, FuncScript.ParseMode.FsTemplate);
            Assert.That(res, Is.EqualTo(expeced));
        }
        [Test]
        public void TestFSTemplate4()
        {
            var template = "abc${['d',1] map (x)=>'>'+x}f";
            var expeced = "abc>d>1f";
            var res = FuncScript.Evaluate(template, new DefaultFsDataProvider(), null, FuncScript.ParseMode.FsTemplate);
            Assert.That(res, Is.EqualTo(expeced));
        }
        [Test]
        public void ListParsingBug_23_6_17()
        {
            var expr = "[[1][2]]";
            Assert.Throws<SyntaxErrorException>(()=>FuncScript.Evaluate(expr));
            

        }
    }
}
