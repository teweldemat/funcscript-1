# FuncScript Editor

`funcscript-editor` provides React components and CodeMirror bindings for editing FuncScript expressions inside web applications.

## Install
```bash
npm install funcscript-editor @tewelde/funcscript react react-dom
```

## Usage
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FuncScriptEditor } from 'funcscript-editor';

function App() {
  return (
    <FuncScriptEditor
      value="{ rate:0.1; return income * (1 - rate); }"
      onChange={console.log}
    />
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

The package ships TypeScript definitions and compiles down to plain JavaScript under `dist/` via the included `prepare` script.

## Scripts
- `npm run build` - emit the TypeScript declaration and JavaScript bundle.
- `npm run clean` - remove the `dist/` output.

## License
Released under the MIT License.
