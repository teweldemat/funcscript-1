using NUnit.Framework;

namespace funcscript.test;

public class DotNetExperiment
{
    [Test]
    public void AreTwoNullsEqual()
    {
        Assert.That(null==null);
    }
}