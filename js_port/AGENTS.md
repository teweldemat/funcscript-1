# FuncScript JavaScript Port
This folder contains the JavaScript port of the **.NET FuncScript interpreter**.  
# Implementation details
Typed Values
- Type information is fundamental to the internal execution of FuncScript functions. In this JavaScript port, every value is represented as a tuple of **(type number, value)** to maintain strict consistency with the .NET implementation.
- The JavaScript interpreter is completely self‑contained and has no external dependencies.

## Folder Structure
- **fs_js** — contains the implementation of the JavaScript FuncScript interpreter.  
- **fs_js_test** — contains unit tests for the interpreter.

## Porting approach
Start from funcscript.core.FuncScriptParser.Parse(IFsDataProvider context, String exp, out ParseNode parseNode) method and follow the call tree.
In js_port/port_progress.md maintain hierarchical dynamic task‑progress list.