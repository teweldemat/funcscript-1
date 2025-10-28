using NUnit.Framework;

namespace FunscScript.Test;

public class DotNetExperiment
{
    [Test]
    public void AreTwoNullsEqual()
    {
        Assert.That(null==null);
    }
}