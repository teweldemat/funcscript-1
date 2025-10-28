using FunscScript.Block;
using FunscScript.Functions.Math;
using System.Text;
using System.Text.RegularExpressions;
using FunscScript.Functions.Logic;
using FunscScript.Model;
using System.Collections.Generic;

namespace FunscScript.Core
{
    public partial class FunscScriptParser
    {
        static int GetExpression(IFsDataProvider parseContext, String exp, int index, out ExpressionBlock prog,
            out ParseNode parseNode, List<SyntaxErrorData> serrors)
        {
            // var i = GetInfixFunctionCall(parseContext, exp, index, out prog, out parseNode, serrors);
            // if (i > index)
            //     return i;

            var i = GetInfixExpression(parseContext, exp, index, out prog, out parseNode, serrors);
            if (i > index)
                return i;

            return index;
        }

        // Other methods like GetInfixFunctionCall, GetInfixExpression, etc., required by GetExpression
        // should also be included in this partial class or another partial class as needed.
    }
}
