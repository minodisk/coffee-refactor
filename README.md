# Coffee Refactor package [![Build Status](https://travis-ci.org/minodisk/coffee-refactor.svg?branch=master)](https://travis-ci.org/minodisk/coffee-refactor)

Refactor CoffeeScript for [Atom](https://atom.io/).

## Reference Finder

### Highlight references

Highlight all references of a symbol under the cursor.

Toggle with `ctrl-alt-r`.

![capture_highlight](https://cloud.githubusercontent.com/assets/514164/2870666/5a3aafbe-d2d6-11e3-959f-14957255a980.gif)

### Rename references

Rename all references of a symbol under the cursor.

1. Set cursor to symbol.
2. Start renaming with `ctrl-r`.
3. Type new name.
4. Finish renaming with `enter`.

![capture_rename](https://cloud.githubusercontent.com/assets/514164/2870667/63182d8c-d2d6-11e3-854b-8c196becfd60.gif)

### Supported Symbols

* variable name
* function name
* parameter name
* class name
* for-in value and index
* for-of key and value

## Highlight Compile Error (EXPERIMENTAL)



## Custom Setting

### Keymap

Override [keymap](kaymaps/coffee-refactor.cson) with `Atom > Open Your Keymap`.

### Style

Override [stylesheet](stylesheets/coffee-refactor.less) with `Atom > Open Your Stylesheet`.

## See

* [Changelog](CHANGELOG.md)
* [MITLicense](LICENSE.md)
