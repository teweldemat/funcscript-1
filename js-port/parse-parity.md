# FunscScript Parser Parity Map

This document matches the C# parser (`FunscScript/Parser/Syntax`) to the JavaScript port (`js-port/funscscript-js/src/parser`).

Status legend:
- `OK` – direct analogue, same responsibility.
- `Combined` – behaviour exists in JS but merged into another helper.
- `Missing` – no JS implementation; feature currently absent or handled differently.

## Shared entry points

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `FunscScript/Parser/FunscScriptParser.cs :: FunscScriptParser.Parse` | `js-port/funscscript-js/src/parser/funscscript-parser.js :: FunscScriptParser.parse` | OK | Both parse an expression, gather errors, and ensure no trailing characters remain. |
| `FunscScript/Parser/Syntax/FunscScriptParser.GetRootExpression.cs :: GetRootExpression` | `js-port/funscscript-js/src/parser/funscscript-parser.js :: getRootExpression` | OK | Chooses between naked KVC and general expression parsing. |

## Shared expression builders

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `FunscScriptParser.GetExpression` | `helpers/expression-parser.js :: getExpression` | OK | Both delegate to the infix parser; prefix/general forms are resolved inside the helper chain. |
| `FunscScriptParser.GetInfixExpression` | `helpers/infix-parser.js :: getInfixExpression` | OK | Delegates to single-level helper with highest precedence. |
| `FunscScriptParser.GetInfixExpressionSingleLevel` | `helpers/infix-parser.js :: getInfixExpressionSingleLevel` | OK | Iteratively folds operands for a precedence tier. |
| `FunscScriptParser.GetInfixFunctionCall` | `helpers/infix-parser.js :: getGeneralInfixFunctionCall` | OK | Handles dual-call infix functions (`a add b ~ c`). |
| `FunscScriptParser.GetOperator` | `helpers/infix-parser.js :: getOperator` | OK | Scans for operator symbol candidates. |
| `FunscScriptParser.GetCallAndMemberAccess` | `helpers/call-and-member-parser.js :: getCallAndMemberAccess` | OK | Parses chained calls, member access, and selectors. |
| `FunscScriptParser.GetFunctionCallParametersList` | `helpers/call-and-member-parser.js :: getFunctionCallParametersList` | OK | Reads `()` or `[]` argument lists with comma separators. |
| `FunscScriptParser.GetMemberAccess` | `helpers/call-and-member-parser.js :: parseMemberAccess` | Combined | JS inlines member access into `getCallAndMemberAccess` rather than exposing a standalone helper. |
| `FunscScriptParser.GetListExpression` | `helpers/list-parser.js :: getListExpression` | OK | Parses bracketed list literals with comma-separated items. |
| `FunscScriptParser.GetKvcExpression` | `helpers/kvc-parser.js :: getKvcExpression` | OK | Builds `KvcExpression` blocks from `{ key: value }` or naked key/value pairs. |
| `FunscScriptParser.GetKeyValuePair` | `helpers/kvc-parser.js :: parseEntries` | Combined | Key/value parsing lives inside the JS `parseEntries` closure. |
| `FunscScriptParser.GetKvcItem` | `helpers/kvc-parser.js :: parseEntries` | Combined | JS parses implicit keys in the same helper rather than via a dedicated method. |
| `FunscScriptParser.GetReturnDefinition` | `helpers/kvc-parser.js :: parseEntries` | Combined | JS handles `return` clauses inline; C# exposes dedicated helper. |
| `FunscScriptParser.GetSwitchExpression` | `helpers/switch-parser.js :: getSwitchExpression` | OK | Consumes selector + case arms mapped to `switch` builtin. |
| `FunscScriptParser.GetCaseExpression` | `helpers/case-parser.js :: getCaseExpression` | OK | Builds `case` function call with alternating condition/value pairs. |
| `FunscScriptParser.GetLambdaExpression` | `helpers/lambda-parser.js :: getLambdaExpression` | OK | Parses parameter list and arrow body into an `ExpressionFunction`. |
| `FunscScriptParser.GetIdentifierList` | `helpers/lambda-parser.js :: getIdentifierList` | Combined | JS keeps the identifier list helper internal to the lambda parser. |
| `FunscScriptParser.GetPrefixOperator` | `helpers/prefix-parser.js :: getPrefixOperator` | OK | Maps prefix symbols (`!`, `-`) to functions and parses operand. |
| `FunscScriptParser.GetUnit` | `helpers/unit-parser.js :: getUnit` | OK | Dispatches to literal, list, KVC, switch/case, lambda, keyword, identifier, or parenthesised expressions. |
| `FunscScriptParser.GetExpInParenthesis` | `helpers/unit-parser.js :: getExpInParenthesis` | OK | Parses `( expression )` blocks. |
| `FunscScriptParser.GetStringTemplate` | `helpers/unit-parser.js :: getStringTemplate` | OK | Both accumulate literal segments and embedded expressions for `f"..."` strings. |

## Shared lexical helpers

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `FunscScriptParser.isCharWhiteSpace` | `helpers/utils.js :: isCharWhiteSpace` | Combined | JS keeps the character test private; behaviour matches C#. |
| `FunscScriptParser.SkipSpace` | `helpers/utils.js :: skipSpace` | OK | Skips whitespace and line comments. |
| `FunscScriptParser.GetCommentBlock` | `helpers/utils.js :: getCommentBlock` | OK | Recognises `//` comments returning a `ParseNode`. |
| `FunscScriptParser.GetLiteralMatch` | `helpers/utils.js :: getLiteralMatch` | OK | Case-insensitive keyword/operator probe. |
| `FunscScriptParser.GetLiteralMatch_IndexOf` | — | Missing | C# optimisation using `IndexOf` is not carried over; JS relies on iterative match. |
| `FunscScriptParser.GetIdentifier` | `helpers/utils.js :: getIdentifier` | OK | Returns identifier text, lowercase form, and node while checking reserved words. |
| `FunscScriptParser.IsIdentfierFirstChar` | `helpers/utils.js :: isIdentifierFirstChar` | Combined | JS keeps the helper private inside the module. |
| `FunscScriptParser.IsIdentfierOtherChar` | `helpers/utils.js :: isIdentifierOtherChar` | Combined | Same as above. |
| `FunscScriptParser.GetKeyWordLiteral` | `helpers/utils.js :: getKeyWordLiteral` | OK | Converts `null/true/false` keywords into literal blocks. |
| `FunscScriptParser.GetInt` | `helpers/utils.js :: getInt` | OK | Parses optional negative integers returning span info. |
| `FunscScriptParser.GetNumber` | `helpers/utils.js :: getNumber` | OK | Handles decimal, exponent, and long-suffix numbers with error reporting. |
| `FunscScriptParser.GetSimpleString` | `helpers/utils.js :: getSimpleString` | OK | Parses quoted string literals with escapes. |

## High level template helpers

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `FunscScriptParser.GetFSTemplate` | `helpers/unit-parser.js :: getStringTemplate` | Combined | JS folds template parsing into the unit parser; C# exposes a standalone API. |
| `FunscScriptParser.ParseFsTemplate` | `funscscript-js/src/funscscript.js :: evaluateTemplate` | Combined | JS runtime helper evaluates templates instead of returning parse nodes directly. |

## Exceptions (C# only)

| C# function | Status | Justification |
| --- | --- | --- |
| `FunscScriptParser.GetConnectionItem` | Missing | Connection syntax (`a -> b` / `a :-> b`) is not yet implemented in the JS port; the DSL features depending on it are currently unsupported. |
| `FunscScriptParser.GetSpaceSepratedListExpression` | Missing | Space-separated list literals (without brackets) are not part of the JavaScript scope; existing tests never exercise them. |
| `FunscScriptParser.ParseSpaceSepratedList` | Missing | Same rationale as above; no equivalent helper exists in JS. |
| `FunscScriptParser.GetSpaceSepratedStringListExpression` | Missing | String specific variant omitted because the JS parser normalises via general list parsing. |
| `FunscScriptParser.GetSpaceLessString` | Missing | JS relies on identifier parsing for token capture; dedicated whitespace-free string helper not ported. |
| `FunscScriptParser.GetInfixExpressionSingleOp` | Missing | JS always permits chained operators per precedence level; the single-op optimisation from C# was skipped to simplify the port. |

## JavaScript-specific helpers

| JavaScript helper | Status | Notes |
| --- | --- | --- |
| `helpers/call-and-member-parser.js :: parseMemberAccessWith` | Combined | In C# the analogous logic lives inside `GetMemberAccess`; JS exposes two local helpers for `.` and `?.`. |
| `helpers/kvc-parser.js :: buildKvc` | Combined | Encapsulates `KvcExpression.SetKeyValues`; C# performs the same work inline. |
| `helpers/kvc-parser.js :: createImplicitReference` | Combined | Mirrors C# implicit key handling done inside `GetKvcItem`. |
