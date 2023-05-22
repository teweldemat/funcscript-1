using funcscript.model;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace funcscript.test
{
    public class JSLikeSyntax
    {
        [Test]
        public void StringInterpolationBasic()
        {
            var p = new KvcProvider(new ObjectKvc(new{x = 100}),
                new DefaultFsDataProvider());
            var res = FuncScript.Evaluate(p, @"f'y={x+2}'");
            Assert.AreEqual("y=102", res);
        }
        [Test]
        public void StringInterpolationEscape()
        {
            var p = new KvcProvider(new ObjectKvc(new { x = 100 }),
                new DefaultFsDataProvider());
            var res = FuncScript.Evaluate(p, @"f'y=\{x+2}'");
            Assert.AreEqual(@"y={x+2}", res);
        }
    }
}
