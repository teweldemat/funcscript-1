using fsstudio.server.fileSystem.exec;

namespace fsstudio.test;

public class Tests
{
    [SetUp]
    public void Setup()
    {
    }

    [Test]
    public void TestRelativeRef()
    {
        var nodes = new[]
        {
            new ExecutionNode
            {
                Name = "x",
                Expression = null,
                ExpressionType = ExpressionType.FsStudioParentNode,
                Children = new ExecutionNode[]
                {
                    new ExecutionNode()
                    {
                        Name = "y",
                        Expression = "a.b",
                        ExpressionType = ExpressionType.FuncScript,
                    },
                    new ExecutionNode()
                    {
                        Name = "a",
                        Expression =null,
                        ExpressionType = ExpressionType.FsStudioParentNode,
                        Children = new ExecutionNode[]
                        {
                            new ExecutionNode()
                            {
                                Name = "b",
                                Expression = "11",
                                ExpressionType = ExpressionType.FuncScript,
                            }
                        }
                    }
                }
            }
        };
        var session = new ExecutionSession(nodes);
        var res=session.RunNode("x.y");
        Assert.That(res,Is.EqualTo(11));
    }
}