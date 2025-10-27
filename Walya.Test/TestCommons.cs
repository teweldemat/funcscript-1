using Newtonsoft.Json;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Walya.Test
{
    internal class TestCommons
    {
        public static void AssertEqualWithJson(object expected, object found)
        {
            if (expected == null || found == null)
                Assert.AreEqual(expected, found);
            else
                Assert.AreEqual(JsonConvert.SerializeObject(expected), JsonConvert.SerializeObject(found));
        }
        public static bool IsSetEqual<T>(IList<T> x, IList<T> y)
        {
            if (x == null && y == null)
                return true;
            if (x == null || y == null)
                return false;

            if (x.Count != y.Count)
                return false;
            foreach (var i in x)
            {
                var found = false;
                foreach (var j in y)
                {
                    if (i.Equals(j))
                    {
                        found = true;
                        break;
                    }
                }
                if (!found)
                    return false;
            }
            return true;
        }
    }
}
