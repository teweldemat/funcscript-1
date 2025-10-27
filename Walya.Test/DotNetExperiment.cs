using NUnit.Framework;

namespace Walya.Test;

public class DotNetExperiment
{
    [Test]
    public void AreTwoNullsEqual()
    {
        Assert.That(null==null);
    }
}