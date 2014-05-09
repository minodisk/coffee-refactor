# Coffee Refactor package [![Build Status](https://travis-ci.org/minodisk/coffee-refactor.svg?branch=master)](https://travis-ci.org/minodisk/coffee-refactor)

Refactor CoffeeScript for [Atom](https://atom.io/).

## Reference Finder

### Highlight references

Highlight all references of a symbol under the cursor.

![capture_highlight](https://cloud.githubusercontent.com/assets/514164/2870666/5a3aafbe-d2d6-11e3-959f-14957255a980.gif)

You can toggle enabled from settings view.

1. Open setting with `Atom > Preferences`.
2. Input 'coffee refactor' to `Filter package` and select 'Coffee Refactor' package.
3. Toggle checkbox named `Highlight Reference`.

### Rename references

Rename all references of a symbol under the cursor.

![capture_rename](https://cloud.githubusercontent.com/assets/514164/2870667/63182d8c-d2d6-11e3-854b-8c196becfd60.gif)

1. Set cursor to symbol.
2. Start renaming with `ctrl-r`.
3. Type new name.
4. Finish renaming with `enter`.

### Supported Symbols

* variable name
* function name
* parameter name
* class name
* for-in value and index
* for-of key and value

## Highlight Compile Error (EXPERIMENTAL)

You can toggle enabled from settings view.

1. Open setting with `Atom > Preferences`.
2. Input 'coffee refactor' to `Filter package` and select 'Coffee Refactor' package.
3. Toggle checkbox named `Highlight Error`.

## Custom Setting

### Keymap

Override [keymap](kaymaps/coffee-refactor.cson) with `Atom > Open Your Keymap`.

### Style

Override [stylesheet](stylesheets/coffee-refactor.less) with `Atom > Open Your Stylesheet`.

## See

* [Changelog](CHANGELOG.md)
* [MITLicense](LICENSE.md)
