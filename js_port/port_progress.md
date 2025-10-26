[.] JavaScript project scaffolding
  [x] Core typed value utilities and data structures
  [x] Minimal parser and evaluator wiring
  [.] Extend builtin functions and advanced blocks
    [x] List literals and key-value scopes
    [x] Lambda expressions and function blocks
   [.] Additional operator set / advanced literals
     [x] Arithmetic and equality operators
      [x] Case/switch constructs & prefix ops
[ ] Port funcscript.test file for file
  [ ] AdvancedSyntax parity
    [x] Naked key-value literal expressions
    [x] General infix syntax (`reduce`, optional chaining)
    [x] Error propagation parity for boolean negation over `null`
  [ ] BasicTests parity
    [x] Support long literals with exponent suffix (e.g. `-12e1l`)
    [x] String interpolation blocks (`f"…"`) inside collections
    [x] Numeric overflow error detection for oversized integers
    [x] JSON literal parsing inside expressions
    [x] `Reduce` without explicit seed infers accumulator type
    [ ] Remaining advanced scenarios in BasicTests.cs
  [ ] FsToDotNet conversion helpers
  [ ] GetLiteralMatch stress coverage
  [ ] KvcTests advanced scenarios (selection, merging, delegates, JSON parity)
  [ ] ParseTree parse-node exposure
  [x] DotNetExperiment parity
  [x] TestCommons utilities
  [ ] Syntax2 language constructs
    [x] String interpolation literals (`f'…'`)
    [x] Null-safe operators (`?.`, `?!`)
    [x] Square bracket indexing on lists
  [ ] SyntaxLibrary comprehensive operator coverage
  [ ] TestErrorReporting diagnostics parity
[ ] Port comprehensive FuncScript feature set
