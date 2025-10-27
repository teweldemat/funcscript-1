using NUnit.Framework;

namespace FuncScript.Test;

public class DotNetExperiment
{
    [Test]
    public void AreTwoNullsEqual()
    {
        Assert.That(null==null);
    }
}