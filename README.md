# FunscScript

FunscScript is a .NET-first expression language and runtime that lets you embed concise, functional business logic inside your applications. It ships with a parser, evaluator, formatter, CLI, unit tests, and optional SQL/GIS helpers, making it straightforward to evaluate custom scripts, map data, or compute derived values at runtime.

## Highlights
- Expression-oriented language with blocks, lambdas, pattern-like switches, string templates, lists, and key-value collections.
- Batteries-included standard library covering math, logic, text, list processing, OS helpers, HTML utilities, and JSON conversion.
- Ergonomic .NET embedding via `FunscScript.Engine.Evaluate(...)`, strongly-typed error reporting, and deterministic formatting utilities.
- Extensible through custom `IFsFunction` implementations or ad-hoc variables injected with `DefaultFsDataProvider`.
- Extra packages for SQL Server and NetTopologySuite geometries, plus an experimental JavaScript interpreter port.

## Repository Layout
- `FunscScript/` - core library targeting .NET 6.0; contains the parser, runtime, standard library, and data model.
- `FunscScript.Cli/` - minimal .NET 8 CLI (`funscscriptcli`) that evaluates expressions from the command line.
- `FunscScript.Example/` - interactive console sample that demonstrates the REPL-style usage of the runtime.
- `FunscScript.Sql/` - optional extension with SQL/geometry helpers and type normalization for ADO.NET results.
- `FunscScript.Test/` - NUnit-based test suite covering parsing, evaluation, errors, and formatting.
- `js-port/` - in-progress JavaScript port plus editor experiments and examples.

## Quick Start
### Prerequisites
Install the .NET 8 SDK (includes the .NET 6 tooling required by the library projects).

### Build Everything
```bash
dotnet restore FunscScript.sln
dotnet build FunscScript.sln
```

### Try the CLI
```bash
# Evaluate a simple expression
dotnet run --project FunscScript.Cli -- "(2 + 3) * 4"

# Evaluate a block with variables and built-in helpers
dotnet run --project FunscScript.Cli -- "{ rate:0.13; net:(gross)=>gross*(1-rate); return net(12500); }"
```

### Embed in Your Application
```csharp
using System;
using System.Collections.Generic;
using FunscScript;
using FunscScript.Model;

var globals = new DefaultFsDataProvider(new List<KeyValuePair<string, object>>
{
    new KeyValuePair<string, object>("taxRate", 0.15),
    new KeyValuePair<string, object>("format", (Func<object,string>)(value => string.Format("{0:#,#0.00}", value)))
});

var expression = "{ net:(gross)=>gross*(1-taxRate); return format(net(gross)); }";
var context = new ObjectKvc(new { gross = 5200 });
var result = FunscScript.Engine.Evaluate(new KvcProvider(context, globals), expression);

var output = new StringBuilder();
FunscScript.Engine.Format(output, result);
Console.WriteLine(output);
```
The runtime normalizes .NET values so that primitive types, lists, key-value collections, GUIDs, byte arrays, and even delegates translate seamlessly to script data.

## Language at a Glance
Script files are case-insensitive and expression-oriented. Common constructs include:
- **Blocks**: `{ items:[1,2,3]; return Sum(items); }`
- **Lambdas**: `(x)=>x*x` or `(row, index)=>{ ... }`
- **String templates**: `f"Hello {name}!"`
- **Collections**: Lists `[1, 2, 3]` and records `{name:"Ada", skills:["math","logic"]}`
- **Control**: `If`, `Switch`, `Case`, `fault` for structured errors
- **Functions**: `Map`, `Reduce`, `Filter`, `Distinct`, `Take`, `JoinText`, `Format`, `TicksToDate`, `point`, and many more

A more elaborate example lives in `FunscScript/TestFormula.text`, where a payroll table is generated via mapping and HTML string templates.

## Extending the Runtime
Custom functions are regular .NET classes implementing `IFsFunction`:
```csharp
public class HexFunction : IFsFunction
{
    public string Symbol => "hex";
    public int MaxParsCount => 1;
    public CallType CallType => CallType.Prefix;
    public int Precedence => 0;

    public object Evaluate(IFsDataProvider context, IParameterList parameters)
    {
        var value = Convert.ToInt64(parameters.GetParameter(context, 0));
        return $"0x{value:X}";
    }

    public string ParName(int index) => "value";
}
```
Create a parameterless constructor, reference the assembly, and `DefaultFsDataProvider.LoadFromAssembly(...)` will auto-register the symbol (including optional aliases via `FunctionAliasAttribute`).

## SQL & GIS Helpers
`FunscScript.Sql` adds converters for `Sql*` types and NetTopologySuite geometries plus GIS helpers such as `point(x, y)`. Reference the project alongside the core library to normalize database values before exposing them to scripts.

## JavaScript Port (Experimental)
The `js-port/` folder contains a progressively feature-complete JavaScript interpreter that mirrors the .NET runtime. See `js-port/AGENTS.md` and `js-port/port-progress.md` for implementation notes and status.

## Testing
Run the NUnit suite to ensure language changes remain backwards compatible:
```bash
dotnet test FunscScript.sln
```

## Contributing
Issues and pull requests are welcome. If you plan substantial language or runtime changes, open an issue first so we can align on approach.

## Maintainers
- Tewelde Ma. Tegegne (<teweldemat@gmail.com>)

## License
Released under the MIT License. See `LICENSE` for details.
