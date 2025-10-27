# Walya JS Runtime

The `walya` package exposes the Walya expression runtime for Node.js and browser environments. It mirrors the .NET interpreter so the same scripts can be evaluated on either platform.

## Install
```bash
npm install walya
```

## Usage
```javascript
import { evaluate, DefaultFsDataProvider } from 'walya';

const provider = new DefaultFsDataProvider({
  gross: 5200,
  taxRate: 0.12
});

const result = evaluate('{ net:(x)=>x*(1-taxRate); return net(gross); }', provider);

console.log(result);
```

The package ships CommonJS (`require`), ESM (`import`), and browser-friendly builds together with TypeScript definitions.

## API Surface
- `evaluate(expression: string, provider?: FsDataProvider)`
- `evaluateTemplate(expression: string, provider?: FsDataProvider)`
- `colorParseTree(node: ParseNode): ParseNode[]`
- `DefaultFsDataProvider`, `MapDataProvider`, `KvcProvider`
- Data helpers such as `ensureTyped`, `valueOf`, `FSDataType`, and the builtin function map

Refer to the root project README for language details and additional helpers.

## License
Released under the MIT License.
