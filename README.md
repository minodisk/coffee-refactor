# Coffee Refactor package

Refactor CoffeeScript for [Atom](https://atom.io/).

![capture](https://cloud.githubusercontent.com/assets/514164/2703394/345b1d5a-c44f-11e3-9640-b9a20c4b7f70.gif)

### Rename references

Rename all references of a symbol under the cursor.

1. Set cursor to symbol.
2. Start renaming with `ctrl-r`.
3. Type new name.
4. Finish renaming with `enter`.

### Highlight references

Highlight all references of a symbol under the cursor.

Toggle with `ctrl-alt-r`.

### Supported Symbols

* variable name
* function name
* parameter name
* class name
* for-in value and index
* for-of key and value

## Custom Style

Override with `Atom > Open Your Stylesheet`.

```less
.editor {
  .coffee-refactor {
    .marker {
      .region {
        position: absolute;
        border-radius: 2px;
        box-sizing: border-box;
        background-color: rgba(54, 175, 144, 0.2);
        border: 1px solid rgba(54, 175, 144, 0.5);
        &.first {
          border-radius: 2px 2px 0 0;
        }
        &.middle {
          border-radius: 0;
        }
        &.last {
          border-radius: 0 0 2px 2px;
        }
      }
    }
  }
}
```

## See

* [Changelog](CHANGELOG.md)
* [MITLicense](LICENSE.md)
