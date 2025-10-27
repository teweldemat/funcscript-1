using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Walya.Error
{
    public class UnsupportedUnderlyingType : Exception
    {
        public UnsupportedUnderlyingType(string message) : base(message)
        {
        }
    }
}
