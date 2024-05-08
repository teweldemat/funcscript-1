using System.Linq.Expressions;
using funcscript;
using funcscript.core;
using funcscript.funcs.misc;
using funcscript.model;

namespace fsstudio.server.fileSystem.exec;

public class ExecutionSession : IFsDataProvider
{
    readonly List<ExecutionNode> _nodes;
    private readonly IFsDataProvider _provider;
    readonly string fileName;
    public Guid SessionId { get; private set; } = Guid.NewGuid();
    private ObjectKvc _sessionVars;
    private FssAppNode _appNode;
    void UpdateFile()
    {
        System.IO.File.WriteAllText(fileName, System.Text.Json.JsonSerializer.Serialize(_nodes));
    }


   
    public ExecutionSession(string fileName)
    {
        
        this.fileName = fileName;
        var json=System.IO.File.ReadAllText(fileName);
        _nodes = System.Text.Json.JsonSerializer.Deserialize<List<ExecutionNode>>(json)??[];

        _sessionVars = new ObjectKvc(new
        {
            app=new ObjectKvc(_appNode=new FssAppNode()),
        });
        this._provider = new KvcProvider(_sessionVars, new DefaultFsDataProvider());
        
    }
   
    private ExecutionNode? FindNodeByPath(string nodePath)
    {
        var segments = nodePath.Split('.');
        ExecutionNode? currentNode = null;

        foreach (var segment in segments)
        {
            currentNode = (currentNode == null ? _nodes : currentNode.Children)
                .FirstOrDefault(n => n.NameLower == segment.ToLower());

            if (currentNode == null)
                break;
        }

        return currentNode;
    }

    public void CreateNode(string? parentNodePath, string name, string expression,ExpressionType expressionType)
    {
        var nodes = parentNodePath == null ?this._nodes: this.FindNodeByPath(parentNodePath)?.Children;
        if (nodes == null)
            throw new InvalidOperationException($"Path {parentNodePath} not found");
        var nameLower = name.ToLower();
        if (nodes.Any(n => n.NameLower == nameLower))
            throw new InvalidOperationException($"Name: {name} already used");
        nodes.Add(new ExecutionNode
        {
            Name = name,
            Expression = expression,
            ExpressionType = expressionType
        });
        UpdateFile();
    }

   
    public void RemoveNode(string nodePath)
    {
        var segments = nodePath.Split('.');
        var parentNodePath = string.Join(".", segments.Take(segments.Length - 1));
        var nodes=segments.Length==1?this._nodes:FindNodeByPath(parentNodePath)?.Children;
        if (nodes == null)
            throw new InvalidOperationException($"Path {parentNodePath} not found");

        var nodeToRemove = nodes.FirstOrDefault(n => n.NameLower == segments.Last().ToLower());
        if (nodeToRemove != null)
        {
            nodes.Remove(nodeToRemove);
        }
        UpdateFile();
    }

    public void RenameNode(string nodePath, string newName)
    {
        var node = FindNodeByPath(nodePath);
        if (node == null)
            throw new Exception("Node not found.");

        node.Name = newName;
        UpdateFile();
    }

    public void ChangeExpressionType(string nodePath, ExpressionType expType)
    {
        var node = FindNodeByPath(nodePath);
        if (node == null)
            throw new Exception("Node not found.");

        node.ExpressionType = expType;
        UpdateFile();
    }
    public void UpdateExpression(string nodePath, string expression)
    {
        var node = FindNodeByPath(nodePath);
        if (node == null)
            throw new Exception("Node not found.");

        node.Expression = expression;
        UpdateFile();
    }

    public List<ExpressionNodeInfo> GetChildNodeList(string? nodePath)
    {
        var nodes = nodePath == null ?this._nodes: this.FindNodeByPath(nodePath)?.Children;
        if (nodes == null)
            throw new InvalidOperationException($"Path {nodePath} not found");

        return nodes.Select(c => new ExpressionNodeInfo
        {
            Name = c.Name,
            ExpressionType = c.ExpressionType,
            ChildrenCount = c.Children.Count
        }).ToList();
    }

    public ExpressionNodeInfoWithExpression? GetExpression(string nodePath)
    {
        var node= FindNodeByPath(nodePath);
        if (node == null)
            return null;
        return new ExpressionNodeInfoWithExpression
        {
            Name = node.Name,
            ExpressionType = node.ExpressionType,
            ChildrenCount = node.Children.Count,
            Expression = node.Expression
        };
    }
    public object GetData(string name)
    {
        var n = _nodes.FirstOrDefault(c => c.NameLower == name);
        if (n == null)
            return _provider.GetData(name);
        return n.Evaluate(_provider);
    }
    public object? RunNode(string nodePath)
    {
        var n = FindNodeByPath(nodePath);
        if (n == null)
            return null;
        _appNode.ClearSink();
        var ret= n.Evaluate(this);
        try
        {
            _appNode.ActivateSignal();
        }
        catch (Exception e)
        {
            Fslogger.DefaultLogger.WriteLine("General error sending start signal: ");
        }
        return ret;
    }
}