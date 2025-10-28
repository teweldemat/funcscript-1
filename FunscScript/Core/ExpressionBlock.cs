using FunscScript.Error;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace FunscScript.Core
{
    /// <summary>
    /// Represents is FunscScript expression block
    /// </summary>
    public abstract class ExpressionBlock
    {
        /// <summary>
        ///The position in the parsed exprssion string where the block starts
        /// </summary>
        public int Pos;
        /// <summary>
        ///The the number of charadcters in the parsed exprssion string block consists of
        /// </summary>
        public int Length;

        public CodeLocation CodeLocation => new CodeLocation(Pos, Length);


        /// <summary>
        /// Evaluates the expression block
        /// </summary>
        /// <param name="provider">Source data for variables references in the expression block</param>
        /// <returns></returns>
        public abstract object Evaluate(IFsDataProvider provider);
        
        /// <summary>
        /// Gets list of child expression blocks
        /// </summary>
        /// <returns></returns>
        public abstract IList<ExpressionBlock> GetChilds();
        /// <summary>
        /// Builds a string expression representing the expression block.
        /// The string that is built will not neccessarily be identical 
        /// to the epxression that is parsed
        /// </summary>
        /// <param name="provider"></param>
        /// <returns></returns>
        public abstract String AsExpString(IFsDataProvider provider);

    }
}
