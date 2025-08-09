# Extension Fixes

This file contains patches for the `sillytavern-utils-lib` package to allow it to be used in a standalone development environment.

## `config.js`

The `config.js` file in `sillytavern-utils-lib/dist` contains several `import` statements that are invalid in a standalone environment. These imports are removed by the patch.
