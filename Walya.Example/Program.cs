// See https://aka.ms/new-console-template for more information
using global::Walya;
using global::Walya.Core;
using global::Walya.Error;
using WalyaRuntime = global::Walya.Walya;
using System.Data;
using static global::Walya.Core.WalyaParser;

do
{
    Console.Write("Enter expression:");
    var exp = Console.ReadLine();
    try
    {
        var res=WalyaRuntime.Evaluate(exp);
        Console.WriteLine("result");
        Console.WriteLine(res.ToString());
    }
    catch(global::Walya.Error.SyntaxError syntaxError)
    {
        if (syntaxError.Message != null)
            Console.WriteLine(syntaxError.Message);
        Console.WriteLine($"{syntaxError.Message}\n{syntaxError.Line}" );
    }
} while (true);
