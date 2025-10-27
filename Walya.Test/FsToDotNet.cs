using global::Walya.Model;
using NUnit.Framework;
using System.Collections.Generic;

namespace Walya.Test;

public class FsToDotNet
{
    class TestModel1
    {
        public string X { get; set; }
    }

    class TestModel2
    {
        public int Y { get; set; }
        public bool Z { get; set; }
    }

    class TestModel3
    {
        public double A { get; set; }
        public string B { get; set; }
    }

    class TestModel4
    {
        public List<int> Numbers { get; set; }
    }

    class TestModel5
    {
        public Dictionary<string, string> Dictionary { get; set; }
    }

    class ChildModel
    {
        public string Name { get; set; }
        public int Age { get; set; }
    }

    class ParentModel
    {
        public string Title { get; set; }
        public ChildModel Child { get; set; }
    }

    class ComplexModel
    {
        public ParentModel Parent { get; set; }
        public List<TestModel1> Items { get; set; }
    }

    [Test]
    public void TestConversionModel1()
    {
        var exp = @"{ x:1+'5'; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel1>();
        Assert.That(m.X == "15");
    }

    [Test]
    public void TestConversionModel2()
    {
        var exp = @"{ y:3*2; z:5>3; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel2>();
        Assert.That(m.Y == 6);
        Assert.That(m.Z == true);
    }

    [Test]
    public void TestConversionModel3()
    {
        var exp = @"{ a:4.5/1.5; b:'Hello'+' '+'World'; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel3>();
        Assert.That(m.A == 3.0);
        Assert.That(m.B == "Hello World");
    }

    [Test]
    public void TestConversionModel4()
    {
        var exp = @"{ numbers:[1,2,3,4,5]; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel4>();
        CollectionAssert.AreEqual(m.Numbers, new List<int> { 1, 2, 3, 4, 5 });
    }

    [Test]
    public void TestConversionModel5()
    {
        var exp = @"{ dictionary:{ 'key1':'value1', 'key2':'value2' }; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel5>();
        Assert.That(m.Dictionary["key1"] == "value1");
        Assert.That(m.Dictionary["key2"] == "value2");
    }

    [Test]
    public void TestConversionModel6()
    {
        var exp = @"{ x:5*3; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel1>();
        Assert.That(m.X == "15");
    }

    [Test]
    public void TestConversionModel7()
    {
        var exp = @"{ y:10/2; z:1<2; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel2>();
        Assert.That(m.Y == 5);
        Assert.That(m.Z == true);
    }

    [Test]
    public void TestConversionModel8()
    {
        var exp = @"{ a:2.2*3; b:'Wal'+'ya'; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel3>();
        Assert.That(m.A,Is.EqualTo(6.6).Within(0.0000001));
        Assert.That(m.B == "Walya");
    }

    [Test]
    public void TestConversionModel9()
    {
        var exp = @"{ numbers:[10,20,30]; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel4>();
        CollectionAssert.AreEqual(m.Numbers, new List<int> { 10, 20, 30 });
    }

    [Test]
    public void TestConversionModel10()
    {
        var exp = @"{ dictionary:{ 'a':'apple', 'b':'banana' }; }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<TestModel5>();
        Assert.That(m.Dictionary["a"] == "apple");
        Assert.That(m.Dictionary["b"] == "banana");
    }

    [Test]
    public void TestConversionParentModel()
    {
        var exp = @"{
            title:'Parent';
            child: {
                name:'Child';
                age:10;
            }
        }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<ParentModel>();
        Assert.That(m.Title == "Parent");
        Assert.That(m.Child.Name == "Child");
        Assert.That(m.Child.Age == 10);
    }

    [Test]
    public void TestConversionComplexModel()
    {
        var exp = @"{
            parent: {
                title:'Parent';
                child: {
                    name:'Child';
                    age:10;
                }
            };
            items: [
                { x:'item1'; },
                { x:'item2'; }
            ]
        }";
        var res = WalyaRuntime.Evaluate(exp);
        Assert.That(res is KeyValueCollection);
        var kvc = (KeyValueCollection)res;
        var m = kvc.ConvertTo<ComplexModel>();
        Assert.That(m.Parent.Title == "Parent");
        Assert.That(m.Parent.Child.Name == "Child");
        Assert.That(m.Parent.Child.Age == 10);
        Assert.That(m.Items.Count == 2);
        Assert.That(m.Items[0].X == "item1");
        Assert.That(m.Items[1].X == "item2");
    }
}
