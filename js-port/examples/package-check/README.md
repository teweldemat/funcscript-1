# FuncScript Package Check

This example project helps you manually validate the FuncScript npm packages before publishing them to the registry.

## What it does
- Packs the local `@tewelde/funcscript` runtime and `@tewelde/funcscript-editor` packages into tarballs under `tarballs/`.
- Installs those tarballs into this project to mimic what consumers receive from npm.
- Runs a small sanity script (`scripts/sanity-check.js`) that imports the runtime package and exercises core functionality.

## Usage
1. From the repository root, run the end-to-end verification workflow:
   ```bash
   cd js-port/examples/package-check
   npm run verify
   ```
   This command cleans previous artifacts, packs the local packages, installs the resulting tarballs, and runs the sanity check.

2. Inspect the generated files if needed:
   - The tarballs land in `tarballs/` for manual inspection (`tar -tf tarballs/<file>.tgz`).
   - `node_modules/` contains the unpacked package contents exactly as they would ship to npm consumers.

3. When finished testing, clean everything with:
   ```bash
   npm run clean
   ```

Adjust or extend `scripts/sanity-check.js` to cover additional runtime/editor behaviours that you care about before publishing.
