# Node FuncScript Console

Sample CLI that evaluates FuncScript expressions with the JavaScript runtime. Use it directly with an argument:

```sh
npm install
node index.js "{a:5}.a"
```

Or start the REPL:

```sh
npm install
node index.js
```

If you already have the `funcscript` package installed globally or in a parent workspace you can skip the local `npm install` and use `npx funcscript-node-example` after linking.

Type expressions and press Enter to see the type and value.
