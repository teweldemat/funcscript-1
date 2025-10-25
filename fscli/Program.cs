using System.Text;
using funcscript;
using funcscript.error;

if (args.Length == 0)
{
    Console.Error.WriteLine("Usage: fscli <expression>");
    return 1;
}

var expression = string.Join(" ", args);

try
{
    var result = FuncScript.Evaluate(expression);
    var buffer = new StringBuilder();
    FuncScript.Format(buffer, result);
    Console.WriteLine(buffer.ToString());
    return 0;
}
catch (SyntaxError syntaxError)
{
    WriteSyntaxError(syntaxError);
    return 1;
}
catch (EvaluationException evaluationError)
{
    WriteEvaluationError(evaluationError);
    return 1;
}
catch (Exception unexpected)
{
    Console.Error.WriteLine(unexpected.Message);
    return 1;
}

static void WriteSyntaxError(SyntaxError error)
{
    if (!string.IsNullOrWhiteSpace(error.Message))
    {
        Console.Error.WriteLine(error.Message);
    }

    if (!string.IsNullOrWhiteSpace(error.Line))
    {
        Console.Error.WriteLine(error.Line);
    }
}

static void WriteEvaluationError(EvaluationException error)
{
    if (!string.IsNullOrWhiteSpace(error.Message))
    {
        Console.Error.WriteLine(error.Message);
    }

    if (error.InnerException != null && !string.IsNullOrWhiteSpace(error.InnerException.Message))
    {
        Console.Error.WriteLine(error.InnerException.Message);
    }
}
