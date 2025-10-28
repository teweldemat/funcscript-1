﻿using global::FunscScript.Core;
using global::FunscScript.Error;
using global::FunscScript.Model;
using NUnit.Framework;
using System;

namespace FunscScript.Test
{
    public class SyntaxLibrary
    {
        void TestResult(string exp, object expected,  Func<object, object> tran = null,string errorType=null)
        {
           
            if (expected is Type)
            {
                Assert.Throws((Type)expected, () =>
                {
                    var res = Tests.AssertSingleResult(exp);

                });
            }
            else
            {
                var res = Tests.AssertSingleResult(exp);
                if (errorType != null)
                {
                    Assert.That(res,Is.TypeOf<FsError>());
                    Assert.That(((FsError)res).ErrorType,Is.EqualTo(errorType));
                }
                else
                    Assert.AreEqual(expected, res);
            }

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
        [TestCase(@"12>[1,2,3,4]", null,FsError.ERROR_TYPE_MISMATCH)]
        [TestCase(@"12>=[1,2,3,4]", null,FsError.ERROR_TYPE_MISMATCH)]
        [TestCase(@"12<[1,2,3,4]", null,FsError.ERROR_TYPE_MISMATCH)]
        [TestCase(@"12<=[1,2,3,4]", null,FsError.ERROR_TYPE_MISMATCH)]


        [TestCase(@"1>2>3", null,FsError.ERROR_PARAMETER_COUNT_MISMATCH)] //chained comparision
        [TestCase(@"1<2<3", null,FsError.ERROR_PARAMETER_COUNT_MISMATCH)]
        [TestCase(@"1=2=3", null,FsError.ERROR_PARAMETER_COUNT_MISMATCH)]
        [TestCase(@"1!=2!=3", null,FsError.ERROR_PARAMETER_COUNT_MISMATCH)]

        [TestCase(@"if(2=null,0,1)", 1)]  //how would if deal with null condition

        [TestCase(@"not(1=1)", false)] //not function
        [TestCase(@"not(3=1)", true)]
        [TestCase(@"not(null)", null,FsError.ERROR_TYPE_MISMATCH)]
        [TestCase(@"not(""0"")",null, FsError.ERROR_TYPE_MISMATCH)]



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
        [TestCase(@"true and ([34]>5)", null,FsError.ERROR_TYPE_MISMATCH)]

        [TestCase(@"false or  ([34]>5)", null,FsError.ERROR_TYPE_MISMATCH)]
        [TestCase(@"true or ([34]>5)", true)]


        [TestCase(@"2*3 in [4,6]", true)] //the precidence bonanza
        [TestCase(@"2=2 and 3=4", false)]
        [TestCase(@"2=2 or 3=4", true)]

        [TestCase(@"{ x:5; return f""ab{x}"";}", "ab5")] //templates
        [TestCase(@"{ x:5; return f""ab{ x}"";}", "ab5")] //skip spaces
        [TestCase(@"{ x:5; return f""ab{ x }"";}", "ab5")]
        [TestCase(@"{ x:5; return f""ab{x }"";}", "ab5")]
        [TestCase(@"f'{1}\''", "1'")] //escape charachter and template expression interference



        [TestCase(@"format(12.123,""#,0.00"")", "12.12")] //test formatting
        [TestCase(@"format(null,""#,0.00"")", "null")]



        [TestCase(@"[4,5,6][1]",5)]     //list indexing
        [TestCase(@"{x:[4,5,6];return x[1]}",5)]
        [TestCase("[2,3,4](0)", 2)]
        [TestCase("([[2,3,4],[3,4,5]])(0)(1)", 3)]
        [TestCase("1!=2",true)]
        [TestCase("1!=1",false)]
        [TestCase("1*2*3*4",24)]
        public void SoManyTests_1(string expr, object res,string errorType=null)
        {
            TestResult(expr,res,errorType:errorType);
        }

        
        [TestCase("false or false or true",true)]
        public void PrecedenceTests(string expr, object res,string errorType=null)
        {
            TestResult(expr,res,errorType:errorType);
        }

        [TestCase("10 - 6.0",4.0d)]
        [TestCase("10 - 6.0", 4.0d)]
        [TestCase("15 + 5l", 20L)]
        [TestCase("20 - 4l", 16L)]
        [TestCase("7.5 + 2.5", 10.0d)]
        [TestCase("8 * 2.0", 16.0d)]
        [TestCase("5.0 / 2", 2.5d)]
        [TestCase("100L - 50", 50L)]
        [TestCase("2L * 3.0", 6.0d)]
        [TestCase("12 / 3L", 4L)]
        [TestCase("3.0 + 4.0", 7.0d)]
        [TestCase("100 - 50.0", 50.0d)]
        [TestCase("5 + 5", 10)]
        [TestCase("25L / 5", 5L)]
        [TestCase("9.0 - 3L", 6.0d)]
        [TestCase("6L * 2", 12L)]
        public void TestNumberTypeMixingLevel1(string expr, object res,string errorType=null)
        {
            TestResult(expr,res,errorType:errorType);
        }
        
        [TestCase("10 - 6.0 + 2 * 3", 10.0d)]
        [TestCase("(15 + 5l) / 2", 10L)]
        [TestCase("20 - (4l + 6)", 10L)]
        [TestCase("7.5 + (2.5 * 2)", 12.5d)]
        [TestCase("(8 * 2.0) / 4", 4.0d)]
        [TestCase("5.0 / 2 + 3", 5.5d)]
        [TestCase("100L - (50 + 25)", 25L)]
        [TestCase("2L * (3.0 + 1)", 8.0d)]
        [TestCase("(12 / 3L) * 2", 8L)]
        [TestCase("3.0 + 4.0 - 2", 5.0d)]
        [TestCase("100 - (50.0 + 25)", 25.0d)]
        [TestCase("(5 + 5) * 2", 20)]
        [TestCase("(25L / 5) + 3", 8L)]
        [TestCase("9.0 - (3L + 1)", 5.0d)]
        [TestCase("6L * 2 - 4", 8L)]
        [TestCase("10 + (20 - 5L) * 2", 40L)]
        [TestCase("(5.0 * 3) - (2 + 1)", 12.0d)]
        [TestCase("50 % 3 + 1.0", 3.0d)]
        [TestCase("100L / (5 + 5)", 10L)]
        [TestCase("(8.0 / 2) * (2 + 1)", 12.0d)]
        [TestCase("20 % 3L + 2.0", 4.0d)]
        [TestCase("7.5 * 2 - (4 / 2L)", 13.0d)]
        [TestCase("(50L - 25) % 4", 1L)]
        [TestCase("2L + (6 * 3.0) / 2", 11.0d)]
        public void TestNumberTypeMixingLevel2(string expr, object res,string errorType=null)
        {
            TestResult(expr,res,errorType:errorType);
        }
        [TestCase("10 + 5L + 2.5", 17.5d)]
        [TestCase("20 - 4.0 - 3L", 13.0d)]
        [TestCase("3 * 2L * 4.0", 24.0d)]
        [TestCase("100 / 5L / 2.0", 10.0d)]
        [TestCase("50 % 7L % 3.0", 50 % 7L % 3.0)]
        [TestCase("5 + 10L + 3 + 2.5", 20.5d)]
        [TestCase("30 - 10L - 5 - 2.0", 13.0d)]
        [TestCase("2 * 3L * 2.0 * 2", 24.0d)]
        [TestCase("120 / 4L / 2 / 3.0", 5.0d)]
        [TestCase("35 % 6L % 5 % 2.0", 35 % 6L % 5 % 2.0)]
        [TestCase("1 + 2L + 3 + 4 + 5.0", 15.0d)]
        [TestCase("50 - 10L - 5 - 3 - 2.0", 30.0d)]
        [TestCase("2 * 3L * 4 * 5 * 1.0", 120.0d)]
        [TestCase("200 / 4L / 5 / 2 / 2.0", 2.5d)]
        [TestCase("55 % 7L % 3 % 2 % 1.0", 55 % 7L % 3 % 2 % 1.0)]
        [TestCase("3 + 5L + 7 + 2.5 + 1", 18.5d)]
        [TestCase("60 - 20L - 10 - 5 - 3.0", 22.0d)]
        [TestCase("2 * 3L * 2 * 4.0 * 1", 48.0d)]
        [TestCase("180 / 3L / 2 / 5.0 / 2", 3.0d)]
        [TestCase("70 % 10L % 6 % 4.0 % 2", 0.0d)]
        public void TestNumberTypeMixingLevel3(string expr, object res,string errorType=null)
        {
            TestResult(expr,res,errorType:errorType);
        }
        [Test]
        public void TestListFormat()
        {
            var exp = "format([1,2,3])";
            var expected = "[1,2,3]";
            var res=(string)Tests.AssertSingleResultType(exp,typeof(string));
            res = res.Replace(" ", "").Replace("\n", "").Replace("\r", "").Replace("\t", "");
            Assert.AreEqual(expected, res);

        }
        [Test]
        public void TestSeriesFunction()
        {
            var res = FunscScriptRuntime.Evaluate("series(1,5)");
            var expected = new ArrayFsList(new object[] { 1, 2, 3, 4, 5 });
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
            var res = FunscScriptRuntime.Evaluate("first([1,2,4,-5,3],(x)=>x<0)");
            Assert.AreEqual(-5, res);
        }
        [Test]
        public void TestFindFirst2()
        {
            var res = FunscScriptRuntime.Evaluate("first([1,2,4,5,3],(x)=>x<0)");
            Assert.IsNull(res);
        }
        [Test]
        public void MemberofNull()
        {
            Assert.Throws<EvaluationException>(() =>
            {
                var res = FunscScriptRuntime.Evaluate("x.a");
            });
        }
    }
}