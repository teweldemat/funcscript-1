using funcscript.model;
using NUnit.Framework;

namespace funcscript.test;

public class FsToDotNet
{
    class TestModel1
    {
        public string X { get; set; }
    }

    [Test]
    public void TestConversionModel1()
    {
        var exp =
@"{
    x:1+'5';                
}";
        var res = FuncScript.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel1>();
        Assert.That(m.X == "15");
    }
}