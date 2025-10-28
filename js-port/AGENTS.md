# FunscScript JavaScript Port
This folder contains the JavaScript port of the **.NET FunscScript interpreter**.  
# Implementation details
Typed Values
- Type information is fundamental to the internal execution of FunscScript functions. In this JavaScript port, every value is represented as a tuple of **(type number, value)** to maintain strict consistency with the .NET implementation.
- The JavaScript interpreter is completely self‑contained and has no external dependencies.

## Folder Structure
- **funscscript-js** — contains the implementation of the JavaScript FunscScript interpreter.  
- **funscscript-js-test** — contains unit tests for the interpreter.

## Porting approach
Start from funscscript.core.FunscScriptParser.Parse(IFsDataProvider context, String exp, out ParseNode parseNode) method and follow the call tree.
In js-port/port-progress.md maintain hierarchical dynamic task‑progress list.
