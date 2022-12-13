using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace fsstudio
{
    internal class VariableItem
    {
        public string Name;
        public string Expression;
    }
    internal class ExpressionSystem
    {
        public String MainExpression="";
        public List<VariableItem> SupportExpressions=new List<VariableItem>();
    }
}
