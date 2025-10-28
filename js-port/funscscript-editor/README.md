# FunscScript Editor

`funscscript-editor` provides React components and CodeMirror bindings for editing FunscScript expressions inside web applications.

## Install
```bash
npm install funscscript-editor @tewelde/funscscript react react-dom
```

## Usage
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FunscScriptEditor } from 'funscscript-editor';

function App() {
  return (
    <FunscScriptEditor
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
