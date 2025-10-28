using System.Collections.Generic;
using NUnit.Framework;
using Walya.Core;
using Walya.Error;

namespace Walya.Test;

public class BugAnalysis
{
    [Test]
    public void ParserPerformanceIssue_Oct_2025()
    {
        var g = new DefaultFsDataProvider();
        var exp = System.IO.File.ReadAllText(@"data/parse-test-1.fx");
        var err = new List<WalyaParser.SyntaxErrorData>();
        var timer = System.Diagnostics.Stopwatch.StartNew();
        var block=WalyaParser.Parse(new DefaultFsDataProvider(), exp,err);
        Assert.NotNull(exp);
        Assert.IsEmpty(err);
        timer.Stop();
        Assert.Less(timer.ElapsedMilliseconds, 1000);
    }
}