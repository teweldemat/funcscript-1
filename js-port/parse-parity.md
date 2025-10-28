# Walya Parser Parity Map

This document matches the C# parser (`Walya/Parser/Syntax`) to the JavaScript port (`js-port/walya-js/src/parser`).

Status legend:
- `OK` – direct analogue, same responsibility.
- `Combined` – behaviour exists in JS but merged into another helper.
- `Missing` – no JS implementation; feature currently absent or handled differently.

## Shared entry points

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `Walya/Parser/WalyaParser.cs :: WalyaParser.Parse` | `js-port/walya-js/src/parser/walya-parser.js :: WalyaParser.parse` | OK | Both parse an expression, gather errors, and ensure no trailing characters remain. |
| `Walya/Parser/Syntax/WalyaParser.GetRootExpression.cs :: GetRootExpression` | `js-port/walya-js/src/parser/walya-parser.js :: getRootExpression` | OK | Chooses between naked KVC and general expression parsing. |

## Shared expression builders

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `WalyaParser.GetExpression` | `helpers/expression-parser.js :: getExpression` | OK | Both delegate to the infix parser; prefix/general forms are resolved inside the helper chain. |
| `WalyaParser.GetInfixExpression` | `helpers/infix-parser.js :: getInfixExpression` | OK | Delegates to single-level helper with highest precedence. |
| `WalyaParser.GetInfixExpressionSingleLevel` | `helpers/infix-parser.js :: getInfixExpressionSingleLevel` | OK | Iteratively folds operands for a precedence tier. |
| `WalyaParser.GetInfixFunctionCall` | `helpers/infix-parser.js :: getGeneralInfixFunctionCall` | OK | Handles dual-call infix functions (`a add b ~ c`). |
| `WalyaParser.GetOperator` | `helpers/infix-parser.js :: getOperator` | OK | Scans for operator symbol candidates. |
| `WalyaParser.GetCallAndMemberAccess` | `helpers/call-and-member-parser.js :: getCallAndMemberAccess` | OK | Parses chained calls, member access, and selectors. |
| `WalyaParser.GetFunctionCallParametersList` | `helpers/call-and-member-parser.js :: getFunctionCallParametersList` | OK | Reads `()` or `[]` argument lists with comma separators. |
| `WalyaParser.GetMemberAccess` | `helpers/call-and-member-parser.js :: parseMemberAccess` | Combined | JS inlines member access into `getCallAndMemberAccess` rather than exposing a standalone helper. |
| `WalyaParser.GetListExpression` | `helpers/list-parser.js :: getListExpression` | OK | Parses bracketed list literals with comma-separated items. |
| `WalyaParser.GetKvcExpression` | `helpers/kvc-parser.js :: getKvcExpression` | OK | Builds `KvcExpression` blocks from `{ key: value }` or naked key/value pairs. |
| `WalyaParser.GetKeyValuePair` | `helpers/kvc-parser.js :: parseEntries` | Combined | Key/value parsing lives inside the JS `parseEntries` closure. |
| `WalyaParser.GetKvcItem` | `helpers/kvc-parser.js :: parseEntries` | Combined | JS parses implicit keys in the same helper rather than via a dedicated method. |
| `WalyaParser.GetReturnDefinition` | `helpers/kvc-parser.js :: parseEntries` | Combined | JS handles `return` clauses inline; C# exposes dedicated helper. |
| `WalyaParser.GetSwitchExpression` | `helpers/switch-parser.js :: getSwitchExpression` | OK | Consumes selector + case arms mapped to `switch` builtin. |
| `WalyaParser.GetCaseExpression` | `helpers/case-parser.js :: getCaseExpression` | OK | Builds `case` function call with alternating condition/value pairs. |
| `WalyaParser.GetLambdaExpression` | `helpers/lambda-parser.js :: getLambdaExpression` | OK | Parses parameter list and arrow body into an `ExpressionFunction`. |
| `WalyaParser.GetIdentifierList` | `helpers/lambda-parser.js :: getIdentifierList` | Combined | JS keeps the identifier list helper internal to the lambda parser. |
| `WalyaParser.GetPrefixOperator` | `helpers/prefix-parser.js :: getPrefixOperator` | OK | Maps prefix symbols (`!`, `-`) to functions and parses operand. |
| `WalyaParser.GetUnit` | `helpers/unit-parser.js :: getUnit` | OK | Dispatches to literal, list, KVC, switch/case, lambda, keyword, identifier, or parenthesised expressions. |
| `WalyaParser.GetExpInParenthesis` | `helpers/unit-parser.js :: getExpInParenthesis` | OK | Parses `( expression )` blocks. |
| `WalyaParser.GetStringTemplate` | `helpers/unit-parser.js :: getStringTemplate` | OK | Both accumulate literal segments and embedded expressions for `f"..."` strings. |

## Shared lexical helpers

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `WalyaParser.isCharWhiteSpace` | `helpers/utils.js :: isCharWhiteSpace` | Combined | JS keeps the character test private; behaviour matches C#. |
| `WalyaParser.SkipSpace` | `helpers/utils.js :: skipSpace` | OK | Skips whitespace and line comments. |
| `WalyaParser.GetCommentBlock` | `helpers/utils.js :: getCommentBlock` | OK | Recognises `//` comments returning a `ParseNode`. |
| `WalyaParser.GetLiteralMatch` | `helpers/utils.js :: getLiteralMatch` | OK | Case-insensitive keyword/operator probe. |
| `WalyaParser.GetLiteralMatch_IndexOf` | — | Missing | C# optimisation using `IndexOf` is not carried over; JS relies on iterative match. |
| `WalyaParser.GetIdentifier` | `helpers/utils.js :: getIdentifier` | OK | Returns identifier text, lowercase form, and node while checking reserved words. |
| `WalyaParser.IsIdentfierFirstChar` | `helpers/utils.js :: isIdentifierFirstChar` | Combined | JS keeps the helper private inside the module. |
| `WalyaParser.IsIdentfierOtherChar` | `helpers/utils.js :: isIdentifierOtherChar` | Combined | Same as above. |
| `WalyaParser.GetKeyWordLiteral` | `helpers/utils.js :: getKeyWordLiteral` | OK | Converts `null/true/false` keywords into literal blocks. |
| `WalyaParser.GetInt` | `helpers/utils.js :: getInt` | OK | Parses optional negative integers returning span info. |
| `WalyaParser.GetNumber` | `helpers/utils.js :: getNumber` | OK | Handles decimal, exponent, and long-suffix numbers with error reporting. |
| `WalyaParser.GetSimpleString` | `helpers/utils.js :: getSimpleString` | OK | Parses quoted string literals with escapes. |

## High level template helpers

| C# function | JavaScript function | Status | Notes |
| --- | --- | --- | --- |
| `WalyaParser.GetFSTemplate` | `helpers/unit-parser.js :: getStringTemplate` | Combined | JS folds template parsing into the unit parser; C# exposes a standalone API. |
| `WalyaParser.ParseFsTemplate` | `walya-js/src/walya.js :: evaluateTemplate` | Combined | JS runtime helper evaluates templates instead of returning parse nodes directly. |

## Exceptions (C# only)

| C# function | Status | Justification |
| --- | --- | --- |
| `WalyaParser.GetConnectionItem` | Missing | Connection syntax (`a -> b` / `a :-> b`) is not yet implemented in the JS port; the DSL features depending on it are currently unsupported. |
| `WalyaParser.GetSpaceSepratedListExpression` | Missing | Space-separated list literals (without brackets) are not part of the JavaScript scope; existing tests never exercise them. |
| `WalyaParser.ParseSpaceSepratedList` | Missing | Same rationale as above; no equivalent helper exists in JS. |
| `WalyaParser.GetSpaceSepratedStringListExpression` | Missing | String specific variant omitted because the JS parser normalises via general list parsing. |
| `WalyaParser.GetSpaceLessString` | Missing | JS relies on identifier parsing for token capture; dedicated whitespace-free string helper not ported. |
| `WalyaParser.GetInfixExpressionSingleOp` | Missing | JS always permits chained operators per precedence level; the single-op optimisation from C# was skipped to simplify the port. |

## JavaScript-specific helpers

| JavaScript helper | Status | Notes |
| --- | --- | --- |
| `helpers/call-and-member-parser.js :: parseMemberAccessWith` | Combined | In C# the analogous logic lives inside `GetMemberAccess`; JS exposes two local helpers for `.` and `?.`. |
| `helpers/kvc-parser.js :: buildKvc` | Combined | Encapsulates `KvcExpression.SetKeyValues`; C# performs the same work inline. |
| `helpers/kvc-parser.js :: createImplicitReference` | Combined | Mirrors C# implicit key handling done inside `GetKvcItem`. |
