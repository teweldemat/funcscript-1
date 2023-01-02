using funcscript.core;
using funcscript.error;
using funcscript.model;
using NUnit.Framework;
using System;

namespace funcscript.test
{
    public class TestSet3
    {


        void TestResult(string exp, object expected, Func<object, object> tran = null)
        {
            if (expected is Type)
            {
                Assert.Throws((Type)expected,()=>
                {
                    var res = Tests.AssertSingleResult(exp);

                });
            }
            else
            {
                var res = Tests.AssertSingleResult(exp);
                if(tran!=null)
                    res=tran(res);
                Assert.AreEqual(expected, res);
            }

        }

        [Test]
        public void TestListIndex1()
        {
            TestResult("[2,3,4](0)", 2);
        }
        [Test]
        public void TestListIndex2()
        {
            TestResult("([2,3,4])(0)", 2);
        }
        [Test]
        public void TestListIndex2D_1()
        {
            TestResult("([[2,3,4],[3,4,5]])(0)(1)", 3);
        }

        [Test]

        [TestCase("1<3", true)] //< and <=
        [TestCase("1<=3", true)]
        [TestCase("3<3", false)]
        [TestCase("3<=3", true)]
        [TestCase("5<=3", false)]
        [TestCase("5<3", false)]

        [TestCase("1>3", false)]  //> and >=
        [TestCase("1>=3", false)]
        [TestCase("3>3", false)]
        [TestCase("3>=3", true)]
        [TestCase("5>=3", true)]
        [TestCase("5>3", true)]

        [TestCase("1>3.0", false)]  //< and <= different int and double
        [TestCase("1>=3.0", false)]
        [TestCase("3>3.0", false)]
        [TestCase("3>=3.0", true)]
        [TestCase("5>=3.0", true)]
        [TestCase("5>3.0", true)]
        [TestCase("3=3.0", true)]

        [TestCase("3=3.0", true)]  //= different int and double


        [TestCase("3=\"3.0\"", false)]  //string to the mix
        [TestCase(@"""99""=""99""", true)]
        [TestCase(@"""99"">""98""", true)]
        [TestCase(@"""90""<""99""", true)]

        [TestCase(@"""99""!=""99""", false)]
        [TestCase(@"""99""<""98""", false)]
        [TestCase(@"""90"">""99""", false)]

        [TestCase(@"null!=""99""", true)]  //null to the mix
        [TestCase(@"null<""98""", null)]
        [TestCase(@"""90"">null", null)]
        [TestCase(@"null=null", true)]

        [TestCase(@"12=[1,2,3,4]", false)] //list data to the mix
        [TestCase(@"12>[1,2,3,4]", typeof(error.EvaluationException))]
        [TestCase(@"12>=[1,2,3,4]", typeof(error.EvaluationException))]
        [TestCase(@"12<[1,2,3,4]", typeof(error.EvaluationException))]
        [TestCase(@"12<=[1,2,3,4]", typeof(error.EvaluationException))]


        [TestCase(@"1>2>3", typeof(error.EvaluationException))] //chained comparision
        [TestCase(@"1<2<3", typeof(error.EvaluationException))]
        [TestCase(@"1=2=3", typeof(error.EvaluationException))]
        [TestCase(@"1!=2!=3", typeof(error.EvaluationException))]

        [TestCase(@"if(2=null,0,1)", 1)]  //how would if deal with null condition

        [TestCase(@"not(1=1)", false)] //not function
        [TestCase(@"not(3=1)", true)]
        [TestCase(@"not(null)", null)]
        [TestCase(@"not(""0"")", typeof(error.EvaluationException))]



        [TestCase("{\"a\":45}.A", 45)] //json accesor case insensitve
        [TestCase("{\"A\":45}.a", 45)]

        [TestCase("1+2//that is it", 3)]
        [TestCase("1+2//that is it\n+5", 8)]

        [TestCase(@"3%2", 1)] //modulo functoin
        [TestCase(@"2%2", 0)]
        [TestCase(@"3%2%2", 1)]
        [TestCase(@"3%2.0", 1.0)]
        [TestCase(@"2%2.0", 0.0)]
        [TestCase(@"3%2%2.0", 1.0)]
        [TestCase(@"3.0%2.0%2", 1.0)]


        [TestCase(@"3/2", 1)] //division (/) functoin
        [TestCase(@"2/2", 1)]
        [TestCase(@"3/2/2", 0)]
        [TestCase(@"3/2.0", 1.5)]
        [TestCase(@"2/2.0", 1.0)]
        [TestCase(@"3/2/2.0", 0.5)]
        [TestCase(@"3.0/2.0/2", 0.75)]

        [TestCase(@"1 in [1,2]", true)] //in function
        [TestCase(@"0 in [1,2]", false)]
        [TestCase(@"0 in [1,2,0]", true)] //finds it at last
        [TestCase(@"0 in [1,0,2]", true)] //finds it in the middle
        [TestCase(@"if(0 in [1,2],1,2)", 2)]
        [TestCase(@"if(1 in [1,2],1,2)", 1)]

        [TestCase(@"""1"" in [""1"",1,2]", true)]
        [TestCase(@"1 in [""1"",2]", false)]
        [TestCase(@"not(""1"" in [""1"",2])", false)]

        [TestCase(@"true and true", true)] //and function
        [TestCase(@"true and false", false)]
        [TestCase(@"true and true and true", true)]
        [TestCase(@"true and false and true", false)]

        [TestCase(@"true or true", true)] //or function
        [TestCase(@"true or false", true)]
        [TestCase(@"true or true or true", true)]
        [TestCase(@"true or false or true", true)]

        [TestCase(@"true and true or false and false", false)] //and or preciden function
        [TestCase(@"true or false and true", true)]

        [TestCase(@"false and ([34]>5)", false)] //don't evaluate uncessary
        [TestCase(@"true and ([34]>5)", typeof(error.EvaluationException))]

        [TestCase(@"false or  ([34]>5)", typeof(error.EvaluationException))]
        [TestCase(@"true or ([34]>5)", true)]


        [TestCase(@"2*3 in [4,6]", true)] //the precidence bonanza
        [TestCase(@"2=2 and 3=4", false)]
        [TestCase(@"2=2 or 3=4", true)]

        [TestCase(@"{ x:5; return ""ab{x}"";}", "ab5")] //templates
        [TestCase(@"{ x:5; return ""ab{ x}"";}", "ab5")] //skip spaces
        [TestCase(@"{ x:5; return ""ab{ x }"";}", "ab5")]
        [TestCase(@"{ x:5; return ""ab{x }"";}", "ab5")]
        [TestCase(@"'{1}\''", "1'")] //escape charcater and template expression interference

        

        [TestCase(@"format(12.123,""#,0.00"")", "12.12")] //test formatting
        [TestCase(@"format(null,""#,0.00"")", "null")]

        public void SoManyTests_1(string expr, object res)
        {
            TestResult(expr, res);
        }

        public void TestListFormt()
        {
            var exp = "fomrat([1,2,3])";
            var expected = "[1,2,3]";
            var res=(string)Tests.AssertSingleResultType(exp,typeof(string));
            res = res.Replace(" ", "").Replace("\n", "").Replace("\r", "").Replace("\t", "");
            Assert.AreEqual(expected, res);

        }


        [Test]
        public void Complicated1()
        {
            var exp =
@"
{
      r:5;
      f:(a,b)=>r*a*b;
      return f(1,2);
}
";
            object expected=5*1*2;
            var res=Tests.AssertSingleResult(exp);
            Assert.AreEqual(expected, res);
        }
        [Test]
        public void TestFindFirst()
        {
            var res = FuncScript.Evaluate("first([1,2,4,-5,3],(x)=>x<0)");
            Assert.AreEqual(-5, res);
        }
        [Test]
        public void TestFindFirst2()
        {
            var res = FuncScript.Evaluate("first([1,2,4,5,3],(x)=>x<0)");
            Assert.IsNull(res);
        }
        [Test]
        public void MemberofNull()
        {
            Assert.Throws<EvaluationException>(() =>
            {
                var res = FuncScript.Evaluate("x.a");
            });
        }
    }
}