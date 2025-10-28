using System.Text;
using global::FunscScript;
using global::FunscScript.Error;
using FunscScriptRuntime = global::FunscScript.Engine;

if (args.Length == 0)
{
    Console.Error.WriteLine("Usage: funscscript <expression>");
    return 1;
}

var expression = string.Join(" ", args);

try
{
    var result = FunscScriptRuntime.Evaluate(expression);
    var buffer = new StringBuilder();
    FunscScriptRuntime.Format(buffer, result);
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

static void WriteSyntaxError(SyntaxError syntaxError)
{
    if (!string.IsNullOrWhiteSpace(syntaxError.Message))
    {
        Console.Error.WriteLine(syntaxError.Message);
    }

    if (!string.IsNullOrWhiteSpace(syntaxError.Line))
    {
        Console.Error.WriteLine(syntaxError.Line);
    }
}

static void WriteEvaluationError(EvaluationException evaluationError)
{
    if (!string.IsNullOrWhiteSpace(evaluationError.Message))
    {
        Console.Error.WriteLine(evaluationError.Message);
    }

    if (evaluationError.InnerException != null && !string.IsNullOrWhiteSpace(evaluationError.InnerException.Message))
    {
        Console.Error.WriteLine(evaluationError.InnerException.Message);
    }
}
