# v0.3.2 on 2014/05/09

* Add checkbox for toggling highlight enabled: discard keybinding `ctrl-alt-r`.
* Add an implementation of highlighting compile error experimentally.

# v0.3.1 on 2014/05/08

* Fixed an issue causing not working highlight in Atom v0.94.0.

# v0.3.0 on 2014/05/04

* Refactored code.
* Detect text modification faster.
* Tune the performance of highlighting.

# v0.2.4 on 2014/05/02

* Fixed an issue causing not working in nested scope.
* Fixed an issue causing not working in construction of `Object`

# v0.2.3 on 2014/05/01

* Fixed an issue causing not working in destructuring assignment statement of `Object`.
* Test on Travis CI.

# v0.2.2 on 2014/05/01

* Fixed an issue causing that didn't discern two symbols in different two scopes.

# v0.2.1 on 2014/04/29

* Fixed an issue causing finding references to be wrong in `Function` in `Array`.

# v0.2.0 on 2014/04/25

* Fixed an issue causing stopping highlighting when typing wrong code.
* Skip key of object literal.
* Skip key access.

# v0.1.12 on 2014/04/20

* Fixed an issue causing finding references to be wrong when multi scoped symbol.

# v0.1.11 on 2014/04/16

* Fixed an issue causing the highlighting to be wrong when focusing at primitive symbols.
* Add class using when highlighting multi-lines.

# v0.1.10 on 2014/04/16

* Support `for-in` and `for-of` statement

# v0.1.9 on 2014/04/15

* Fixed error thrown when toggle highlight after closing editor.
* Replace capture in README.

# v0.1.7-v0.1.8 on 2014/04/15

* Support highlighting.

# v0.1.6 on 2014/04/12

* Add capture to README.
* Add descriptions about operation and support to README.

# v0.1.5 on 2014/04/11

* Support renaming over lexical scope.

# v0.1.3-v0.1.4 on 2014/04/10

* Implement finding references with `Literal` class.

# v0.1.2 on 2014/04/10

* Support renaming parameter.
* Support renaming class name.

# v0.1.1 on 2014/04/09

* Add tests.
* Support renaming variable.

# v0.1.0 on 2014/04/09

* Initial release.
* Implement node parser with `coffee.nodes`.
