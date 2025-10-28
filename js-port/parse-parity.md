# FuncScript Parser Parity Map

This document matches the C# parser (`FuncScript/Parser/Syntax`) to the JavaScript port (`js-port/funcscript-js/src/parser`).

Status legend:
- `OK` – direct analogue, same responsibility.
- `Combined` – behaviour exists in JS but merged into another helper.
- `Missing` – no JS implementation; feature currently absent or handled differently.

## Shared entry points

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `FuncScript/Parser/FuncScriptParser.cs :: FuncScriptParser.Parse` | `js-port/funcscript-js/src/parser/funcscript-parser.js :: FuncScriptParser.parse` | OK | Both parse an expression, gather errors, and ensure no trailing characters remain. |
| `FuncScript/Parser/Syntax/FuncScriptParser.GetRootExpression.cs :: GetRootExpression` | `js-port/funcscript-js/src/parser/funcscript-parser.js :: getRootExpression` | OK | Chooses between naked KVC and general expression parsing. |

## Shared expression builders

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `FuncScriptParser.GetExpression` | `helpers/expression-parser.js :: getExpression` | OK | Both delegate to the infix parser; prefix/general forms are resolved inside the helper chain. |
| `FuncScriptParser.GetInfixExpression` | `helpers/infix-parser.js :: getInfixExpression` | OK | Delegates to single-level helper with highest precedence. |
| `FuncScriptParser.GetInfixExpressionSingleLevel` | `helpers/infix-parser.js :: getInfixExpressionSingleLevel` | OK | Iteratively folds operands for a precedence tier. |
| `FuncScriptParser.GetInfixFunctionCall` | `helpers/infix-parser.js :: getGeneralInfixFunctionCall` | OK | Handles dual-call infix functions (`a add b ~ c`). |
| `FuncScriptParser.GetOperator` | `helpers/infix-parser.js :: getOperator` | OK | Scans for operator symbol candidates. |
| `FuncScriptParser.GetCallAndMemberAccess` | `helpers/call-and-member-parser.js :: getCallAndMemberAccess` | OK | Parses chained calls, member access, and selectors. |
| `FuncScriptParser.GetFunctionCallParametersList` | `helpers/call-and-member-parser.js :: getFunctionCallParametersList` | OK | Reads `()` or `[]` argument lists with comma separators. |
| `FuncScriptParser.GetMemberAccess` | `helpers/call-and-member-parser.js :: parseMemberAccess` | Combined | JS inlines member access into `getCallAndMemberAccess` rather than exposing a standalone helper. |
| `FuncScriptParser.GetListExpression` | `helpers/list-parser.js :: getListExpression` | OK | Parses bracketed list literals with comma-separated items. |
| `FuncScriptParser.GetKvcExpression` | `helpers/kvc-parser.js :: getKvcExpression` | OK | Builds `KvcExpression` blocks from `{ key: value }` or naked key/value pairs. |
| `FuncScriptParser.GetKeyValuePair` | `helpers/kvc-parser.js :: parseEntries` | Combined | Key/value parsing lives inside the JS `parseEntries` closure. |
| `FuncScriptParser.GetKvcItem` | `helpers/kvc-parser.js :: parseEntries` | Combined | JS parses implicit keys in the same helper rather than via a dedicated method. |
| `FuncScriptParser.GetReturnDefinition` | `helpers/kvc-parser.js :: parseEntries` | Combined | JS handles `return` clauses inline; C# exposes dedicated helper. |
| `FuncScriptParser.GetSwitchExpression` | `helpers/switch-parser.js :: getSwitchExpression` | OK | Consumes selector + case arms mapped to `switch` builtin. |
| `FuncScriptParser.GetCaseExpression` | `helpers/case-parser.js :: getCaseExpression` | OK | Builds `case` function call with alternating condition/value pairs. |
| `FuncScriptParser.GetLambdaExpression` | `helpers/lambda-parser.js :: getLambdaExpression` | OK | Parses parameter list and arrow body into an `ExpressionFunction`. |
| `FuncScriptParser.GetIdentifierList` | `helpers/lambda-parser.js :: getIdentifierList` | Combined | JS keeps the identifier list helper internal to the lambda parser. |
| `FuncScriptParser.GetPrefixOperator` | `helpers/prefix-parser.js :: getPrefixOperator` | OK | Maps prefix symbols (`!`, `-`) to functions and parses operand. |
| `FuncScriptParser.GetUnit` | `helpers/unit-parser.js :: getUnit` | OK | Dispatches to literal, list, KVC, switch/case, lambda, keyword, identifier, or parenthesised expressions. |
| `FuncScriptParser.GetExpInParenthesis` | `helpers/unit-parser.js :: getExpInParenthesis` | OK | Parses `( expression )` blocks. |
| `FuncScriptParser.GetStringTemplate` | `helpers/unit-parser.js :: getStringTemplate` | OK | Both accumulate literal segments and embedded expressions for `f"..."` strings. |

## Shared lexical helpers

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `FuncScriptParser.isCharWhiteSpace` | `helpers/utils.js :: isCharWhiteSpace` | Combined | JS keeps the character test private; behaviour matches C#. |
| `FuncScriptParser.SkipSpace` | `helpers/utils.js :: skipSpace` | OK | Skips whitespace and line comments. |
| `FuncScriptParser.GetCommentBlock` | `helpers/utils.js :: getCommentBlock` | OK | Recognises `//` comments returning a `ParseNode`. |
| `FuncScriptParser.GetLiteralMatch` | `helpers/utils.js :: getLiteralMatch` | OK | Case-insensitive keyword/operator probe. |
| `FuncScriptParser.GetLiteralMatch_IndexOf` | — | Missing | C# optimisation using `IndexOf` is not carried over; JS relies on iterative match. |
| `FuncScriptParser.GetIdentifier` | `helpers/utils.js :: getIdentifier` | OK | Returns identifier text, lowercase form, and node while checking reserved words. |
| `FuncScriptParser.IsIdentfierFirstChar` | `helpers/utils.js :: isIdentifierFirstChar` | Combined | JS keeps the helper private inside the module. |
| `FuncScriptParser.IsIdentfierOtherChar` | `helpers/utils.js :: isIdentifierOtherChar` | Combined | Same as above. |
| `FuncScriptParser.GetKeyWordLiteral` | `helpers/utils.js :: getKeyWordLiteral` | OK | Converts `null/true/false` keywords into literal blocks. |
| `FuncScriptParser.GetInt` | `helpers/utils.js :: getInt` | OK | Parses optional negative integers returning span info. |
| `FuncScriptParser.GetNumber` | `helpers/utils.js :: getNumber` | OK | Handles decimal, exponent, and long-suffix numbers with error reporting. |
| `FuncScriptParser.GetSimpleString` | `helpers/utils.js :: getSimpleString` | OK | Parses quoted string literals with escapes. |

## High level template helpers

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `FuncScriptParser.GetFSTemplate` | `helpers/unit-parser.js :: getStringTemplate` | Combined | JS folds template parsing into the unit parser; C# exposes a standalone API. |
| `FuncScriptParser.ParseFsTemplate` | `funcscript-js/src/funcscript.js :: evaluateTemplate` | Combined | JS runtime helper evaluates templates instead of returning parse nodes directly. |

## Exceptions (C# only)

| C# function | Status | Justification |
| --- | --- | --- |
| `FuncScriptParser.GetConnectionItem` | Missing | Connection syntax (`a -> b` / `a :-> b`) is not yet implemented in the JS port; the DSL features depending on it are currently unsupported. |
| `FuncScriptParser.GetSpaceSepratedListExpression` | Missing | Space-separated list literals (without brackets) are not part of the JavaScript scope; existing tests never exercise them. |
| `FuncScriptParser.ParseSpaceSepratedList` | Missing | Same rationale as above; no equivalent helper exists in JS. |
| `FuncScriptParser.GetSpaceSepratedStringListExpression` | Missing | String specific variant omitted because the JS parser normalises via general list parsing. |
| `FuncScriptParser.GetSpaceLessString` | Missing | JS relies on identifier parsing for token capture; dedicated whitespace-free string helper not ported. |
| `FuncScriptParser.GetInfixExpressionSingleOp` | Missing | JS always permits chained operators per precedence level; the single-op optimisation from C# was skipped to simplify the port. |

## JavaScript-specific helpers

| JavaScript helper | Status | Notes |
| --- | --- | --- |
| `helpers/call-and-member-parser.js :: parseMemberAccessWith` | Combined | In C# the analogous logic lives inside `GetMemberAccess`; JS exposes two local helpers for `.` and `?.`. |
| `helpers/kvc-parser.js :: buildKvc` | Combined | Encapsulates `KvcExpression.SetKeyValues`; C# performs the same work inline. |
| `helpers/kvc-parser.js :: createImplicitReference` | Combined | Mirrors C# implicit key handling done inside `GetKvcItem`. |
