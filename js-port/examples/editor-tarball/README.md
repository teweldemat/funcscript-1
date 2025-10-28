# FuncScript Editor Tarball Check

This Vite + React sample mirrors `js-port/examples/editor`, but it installs the FuncScript runtime and editor packages from locally packed `.tgz` files. Use it to smoke test the packages exactly as they will be consumed from npm before publishing.

## Workflow
1. From the repository root run:
   ```bash
   cd js-port/examples/editor-tarball
   npm install
   ```
   The `preinstall` hook runs `scripts/prepare-tarballs.cjs`, which:
   - Packs `@tewelde/funcscript` and `@tewelde/funcscript-editor` using `npm pack`.
   - Drops the tarballs into `tarballs/` with deterministic names.
   - Keeps `package.json` dependencies pointed at those tarballs via `file:` specifiers.

2. Start the dev server or run a production build:
   ```bash
   npm run dev     # Vite dev server
   npm run build   # Type-check + production bundle
   npm run preview # Preview the production build
   ```

3. After validating the UI, you can safely publish the tarballs that were generated during install (`tarballs/*.tgz`).

To regenerate tarballs without reinstalling dependencies, run `npm run prepare-tarballs`.

## Cleanup
- `rm -rf node_modules tarballs package-lock.json` to reset the workspace.

Extend `scripts/prepare-tarballs.cjs` or add additional checks as needed to cover extra packaging scenarios.
