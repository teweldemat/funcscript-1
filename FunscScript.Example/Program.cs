// See https://aka.ms/new-console-template for more information
using global::FunscScript;
using global::FunscScript.Core;
using global::FunscScript.Error;
using FunscScriptRuntime = global::FunscScript.Engine;
using System.Data;
using static global::FunscScript.Core.FunscScriptParser;

do
{
    Console.Write("Enter expression:");
    var exp = Console.ReadLine();
    try
    {
        var res=FunscScriptRuntime.Evaluate(exp);
        Console.WriteLine("result");
        Console.WriteLine(res.ToString());
    }
    catch(global::FunscScript.Error.SyntaxError syntaxError)
    {
        if (syntaxError.Message != null)
            Console.WriteLine(syntaxError.Message);
        Console.WriteLine($"{syntaxError.Message}\n{syntaxError.Line}" );
    }
} while (true);
