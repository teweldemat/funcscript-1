const { expectEvaluation, runCase, finalizeSuite } = require('./common');

function run() {
  const suite = {};

  const objectCases = [
    { name: 'Model1 string concat', expression: "{ x:1+'5'; }", expected: { x: '15' } },
    { name: 'Model2 numeric and boolean', expression: "{ y:3*2; z:5>3; }", expected: { y: 6, z: true } },
    {
      name: 'Model3 division and text',
      expression: "{ a:4.5/1.5; b:'Hello'+' '+'World'; }",
      expected: { a: 3, b: 'Hello World' }
    },
    { name: 'Model4 list', expression: '{ numbers:[1,2,3,4,5]; }', expected: { numbers: [1, 2, 3, 4, 5] } },
    {
      name: 'Model5 nested key value',
      expression: "{ dictionary:{ 'key1':'value1', 'key2':'value2' }; }",
      expected: { dictionary: { key1: 'value1', key2: 'value2' } }
    },
    { name: 'Model6 multiplication reuse', expression: '{ x:5*3; }', expected: { x: 15 } },
    { name: 'Model7 division and compare', expression: '{ y:10/2; z:1<2; }', expected: { y: 5, z: true } },
    {
      name: 'Model8 real numbers',
      expression: "{ a:2.2*3; b:'Func'+'Script'; }",
      expected: { a: 6.6000000000000005, b: 'FuncScript' }
    },
    { name: 'Model9 alternate numbers', expression: '{ numbers:[10,20,30]; }', expected: { numbers: [10, 20, 30] } },
    {
      name: 'Model10 alternate dictionary',
      expression: "{ dictionary:{ 'a':'apple', 'b':'banana' }; }",
      expected: { dictionary: { a: 'apple', b: 'banana' } }
    },
    {
      name: 'ParentModel hierarchy',
      expression: `{
            title:'Parent';
            child: {
                name:'Child';
                age:10;
            }
        }`,
      expected: {
        title: 'Parent',
        child: {
          name: 'Child',
          age: 10
        }
      }
    },
    {
      name: 'ComplexModel hierarchical list',
      expression: `{
            parent: {
                title:'Parent';
                child: {
                    name:'Child';
                    age:10;
                }
            };
            items: [
                { x:'item1'; },
                { x:'item2'; }
            ]
        }`,
      expected: {
        parent: {
          title: 'Parent',
          child: {
            name: 'Child',
            age: 10
          }
        },
        items: [
          { x: 'item1' },
          { x: 'item2' }
        ]
      }
    }
  ];

  objectCases.forEach(({ name, expression, expected }) => {
    runCase(suite, name, () => expectEvaluation(expression, expected));
  });

  finalizeSuite('FsToDotNet', suite);
}

module.exports = {
  run
};
