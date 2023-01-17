using funcscript.core;
using funcscript.model;
using NUnit.Framework;
using NUnit.Framework.Constraints;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.test
{
    delegate void VoidDelegate(int x);
    delegate int DelegateWithOut(int x, out int y);
    internal class KvcTests
    {
        [Test]
        public void TestKvcSimple()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g, "{a:3,c:5}");
            var expected = new ObjectKvc(new { a = 3, c = 5 });
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestKvcCrossRef()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,"{a:3,c:5,d:a*c}");
            var expected = new ObjectKvc(new { a = 3, c = 5,d=15 });
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestKvcReturn()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,"{a:3,c:5,d:a*c,return d}");
            var expected = 15;
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestKvcIdenOnly()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,"{a:4,b:5,c:6,return {a,c}}");
            var expected = new ObjectKvc(new {a=4,c=6});
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestSelector()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,"{a:4,b:5,c:6}{a,c}");
            var expected = new ObjectKvc(new { a = 4, c = 6 });
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestSelector2()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,"{a:4,b:5,c:6}{'a',\"c\"}");
            var expected = new ObjectKvc(new { a = 4, c = 6 });
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestSelectorChain()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,"{a:{id:3}}.a.id\r\n");
            var expected = 3; ;
            Assert.AreEqual(expected, res);
        }

        [Test]
        public void TestSelectorWithExp()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,"{a:4,b:5,c:6} {a,c,z:45}");
            var expected = new ObjectKvc(new { a = 4, c = 6,z=45 });
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestSelectorOnArray()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,"[{a:4,b:5,c:6},{a:7,b:8,c:9}]\n{a,c}");
            var expected = new FsList(new object[]{new ObjectKvc(new { a = 4, c=6})
            ,new ObjectKvc(new { a = 7, c = 9})
            });
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void ChainFunctionCall()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,"((x)=>((y)=>3*y))(0)(2)");
            var expected = 6;
            Assert.AreEqual(expected, res);

        }
        [Test]
        public void DoubleMap()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,@"{
z:Map([1,2,3],(x)=>x*x),
return Map(z,(x)=>x*x);
}") as FsList;
            Assert.IsNotNull(res);
            var expected = new FsList(new object[] {1,16,81});
            
            Assert.AreEqual(expected.Data, res.Data);
        }

        [Test]
        public void KvcMergeHeriarchy()
        {
            var g = new DefaultFsDataProvider();
            var res = FuncScript.Evaluate(g,@"{a:12,b:{c:10,z:10}}+{d:13,b:{c:12,x:5}}");
            var expected = new ObjectKvc(new { a = 12, d = 13, b=new {c=12,z=10,x=5 } });

            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestDelegate()
        {
            var vars = new 
            {
                f=new Func<int,int>((x)=>x+1)
            };
            Assert.AreEqual(4, FuncScript.EvaluateWithVars("f(3)", vars));
        }

        
        [Test]
        public void TestDelegateRejectOut()
        {
            Assert.Throws(typeof(funcscript.error.TypeMismatchError)
                , () =>
                {
                    var vars = new
                    {
                        f = new DelegateWithOut((int x,out int y) => {
                            y= 2;
                            return x + 1;
                        }
                        )
                    };
                    var ret = FuncScript.EvaluateWithVars("f(3)", vars);
                });
        }
        [Test]
        public void TestDelegateRejectVoid()
        {
            Assert.Throws(typeof(funcscript.error.TypeMismatchError)
                , () =>
                {
                    var vars = new
                    {
                        f = new VoidDelegate((x) => { })
                    };
                    var ret = FuncScript.EvaluateWithVars("f(3)", vars);
                });
        }
        [Test]
        public void ByteArray()
        {
            var bytes = new byte[] { 1, 2, 3 };
            var b=FuncScript.EvaluateWithVars("x", new { x = bytes });
            Assert.AreEqual(bytes, b);
        }
        class XY
        {
            String a;
            String b;
        }
        [Test]
        public void TestJsonEquivalenceWithTextLineFeed()
        {
            var a = @"{
";
            var b = @"c
d";
            var x= new ObjectKvc(new { a, b });
            var sb = new StringBuilder();
            FuncScript.Format(sb, null, null,false, true);
            var str=sb.ToString();
            var ret = Newtonsoft.Json.JsonConvert.DeserializeObject<XY>(str);
        }
        [Test]
        public void TestListParse2()
        {
            var exp = @" [ [ 3, 4 ] , [ 5 , 6 ] ]";
            var expected = new FsList(new object[] { new FsList(new object[] { 3,4}) ,
                 new FsList(new object[] { 5, 6 }) });
            var res = FuncScript.Evaluate(exp) as FsList;
            Assert.NotNull(res);
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestListParse3()
        {
            var exp = " \n [ \n [ \n 3 \n , \n 4 \n ] \n , \n [ \n 5 \n , \n 6 \n ] \n ] \n ";
            var expected = new FsList(new object[] { new FsList(new object[] { 3,4}) ,
                 new FsList(new object[] { 5, 6 }) });
            var res = FuncScript.Evaluate(exp) as FsList;
            Assert.NotNull(res);
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void FromJson1()
        {
            string json = "{x:1}";
            var expected = new ObjectKvc(new { x = 1 });

            var res = FuncScript.FromJson(json);
            
            Assert.AreEqual(expected, res);
        }

        [Test]
        [TestCase("5",5)]
        [TestCase("5.0", 5.0)]
        [TestCase("'5'", "5")]
        public void FromJsonAtomic(string json,object expected)
        {
            var res = FuncScript.FromJson(json);
            Assert.AreEqual(expected, res);
        }
        [Test]
        [TestCase("5", "5")]
        [TestCase("5.0", "5.0")]
        
        [TestCase("'5'", "'5'")]
        [TestCase("'5'", "\"5\"")]
        [TestCase("'{5'", @"'\{5'")]
        [TestCase("{x:1,y:2}", "{x:1,y:2}")]
        [TestCase("{x:[1,2],y:2}", "{x:[1,2],y:2}")]
        [TestCase("{x:[1,2,'3'],y:2}", "{x:[1,2,'3'],y:2}")]
        public void FromJsonFs(string json, string fs)
        {
            var res = FuncScript.FromJson(json);
            var expected = FuncScript.Evaluate(fs);
            Assert.AreEqual(expected, res);
        }
    }

}
