# FuncScript Browser Playground

This example project showcases how to execute FuncScript expressions from a TypeScript + React application that uses Material UI for styling.

## Getting started

```bash
cd js-port/example
npm install
npm run dev
```

The app runs on [http://localhost:5173](http://localhost:5173) by default.

## Notes

- The playground imports the browser-friendly bundle (`FuncScript.browser.js`), which excludes filesystem-oriented functions that rely on Node.js `fs` APIs.
- Results show both the FuncScript data type and a JSON representation of the underlying value for easier inspection.
