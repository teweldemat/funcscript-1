# FuncScript JavaScript Port
This folder contains the JavaScript port of the **.NET FuncScript interpreter**.  
# Implementation details
Typed values
- Because type information is critical for internal implementations of FuncScript functions, all values in the JavaScript port are represented as tuples of **(type number, value)**.  
This approach ensures consistent and reliable compatibility with the original .NET implementation.
- The javascript interpreter will be self contained no dependency library

## Folder Structure
- **fs_js** — contains the implementation of the JavaScript FuncScript interpreter.  
- **fs_js_test** — contains unit tests for the interpreter.

## Porting approach
Start from funcscript.core.FuncScriptParser.Parse(IFsDataProvider context, String exp, out ParseNode parseNode) method and follow the call tree.
In js_port/port_progress.md maintain heirachical dynamic task progress list.