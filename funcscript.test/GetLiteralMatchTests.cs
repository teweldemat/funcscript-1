using funcscript.core;
using NUnit.Framework;
using System;
using System.Linq;

namespace GetLiteralMatchTests
{
    [TestFixture]
    public class TestGetLiteralMatch
    {
        [Test]
        public void TestExactMatch()
        {
            string exp = "Hello, world!";
            int index = FuncScriptParser.GetLiteralMatch(exp, 0, "Hello");
            Assert.AreEqual(5, index);
        }

        [Test]
        public void TestPartialMatch()
        {
            string exp = "Hello, world!";
            int index = FuncScriptParser.GetLiteralMatch(exp, 0, "He");
            Assert.AreEqual(2, index);
        }


        [Test]
        public void TestNoMatch()
        {
            string exp = "Hello, world!";
            int index = FuncScriptParser.GetLiteralMatch(exp, 0, "Goodbye");
            Assert.AreEqual(0, index);
        }

        [Test]
        public void TestCaseInsensitive()
        {
            string exp = "Hello, world!";
            int index = FuncScriptParser.GetLiteralMatch(exp, 0, "HELLO");
            Assert.AreEqual(5, index);
        }

        [Test]
        public void TestMultipleKeywords()
        {
            string exp = "Hello, world!";
            int index = FuncScriptParser.GetLiteralMatch(exp, 0, "Goodbye", "Hello", "Hi");
            Assert.AreEqual(5, index);
        }

        [Test]
        public void TestIndexOutOfBounds()
        {
            string exp = "Hello, world!";
            int index = FuncScriptParser.GetLiteralMatch(exp, 20, "Hello");
            Assert.AreEqual(20, index);
        }


        [Test]
        public void StressTest()
        {
            // Create a random generator
            Random rnd = new Random();

            // Create a large input string with random 'a' characters
            int prefixLength = 99_000_000;
            int suffixLength = 99_000_000;
            string exp = new string('a', prefixLength) + "Hello, world!" + new string('a', suffixLength);

            // Create an array of keywords, including the target keyword
            int keywordCount = 9_000_000;
            string[] keywords = Enumerable.Range(1, keywordCount).Select(x => "kw" + x).ToArray();

            // Randomly place the target keyword in the array
            int targetKeywordIndex = rnd.Next(keywordCount);
            keywords[targetKeywordIndex] = "Hello, world!";

            // Measure execution time
            var timer = System.Diagnostics.Stopwatch.StartNew();
            int index = FuncScriptParser.GetLiteralMatch(exp, prefixLength, keywords);
            timer.Stop();

            // Check if the result is correct
            Assert.AreEqual(prefixLength + 13, index);

            // Check if the execution time is reasonable (e.g., less than 5 seconds)
            Assert.Less(timer.ElapsedMilliseconds, 5000);
        }
    }
}
