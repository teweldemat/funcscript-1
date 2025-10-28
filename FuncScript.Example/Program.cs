// See https://aka.ms/new-console-template for more information
using global::FuncScript;
using global::FuncScript.Core;
using global::FuncScript.Error;
using FuncScriptRuntime = global::FuncScript.Engine;
using System.Data;
using static global::FuncScript.Core.FuncScriptParser;

do
{
    Console.Write("Enter expression:");
    var exp = Console.ReadLine();
    try
    {
        var res=FuncScriptRuntime.Evaluate(exp);
        Console.WriteLine("result");
        Console.WriteLine(res.ToString());
    }
    catch(global::FuncScript.Error.SyntaxError syntaxError)
    {
        if (syntaxError.Message != null)
            Console.WriteLine(syntaxError.Message);
        Console.WriteLine($"{syntaxError.Message}\n{syntaxError.Line}" );
    }
} while (true);
