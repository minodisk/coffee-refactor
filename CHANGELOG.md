# v0.4.8 on 2014/07/08

* Updated atom-refactor to v0.1.3.

# v0.4.7 on 2014/07/03

* Fixed an issue wrong position in "string" interpolation.

# v0.4.4-v0.4.6 on 2014/06/28

* Fixed an issue aborting installation.

# v0.4.3 on 2014/06/27

* Fixed an issue wrong position in """string""" interpolation.

# v0.4.2 on 2014/05/21

* Supported `for-in` statement with destructuring assignment.
* Supported `for-of` statement with destructuring assignment.

# v0.4.1 on 2014/05/20

* Updated atom-refactor to v0.1.2.
* Implemented compatible interface to [js-refactor](https://atom.io/packages/js-refactor).

# v0.4.0 on 2014/05/17

* Separated core module related to view-controller and view to atom-refactor.

# v0.3.5 on 2014/05/16

* Fixed an issue that remaning was not working.

# v0.3.4 on 2014/05/16

* Improved behavior about aborting renaming.

# v0.3.3 on 2014/05/10

* Fixed an issue wrong error range.

# v0.3.2 on 2014/05/09

* Started using setting view to toggle highlighting enabled.
* Added an implementation of highlighting compile error experimentally.

# v0.3.1 on 2014/05/08

* Fixed an issue causing not working highlight in Atom v0.94.0.

# v0.3.0 on 2014/05/04

* Refactored code.
* Improved detecting text modification faster.
* Improved the performance of highlighting.

# v0.2.4 on 2014/05/02

* Fixed an issue causing not working in nested scope.
* Fixed an issue causing not working in construction of `Object`

# v0.2.3 on 2014/05/01

* Fixed an issue causing not working in destructuring assignment statement of `Object`.
* Started testing on Travis CI.

# v0.2.2 on 2014/05/01

* Fixed an issue causing that didn't discern two symbols in different two scopes.

# v0.2.1 on 2014/04/29

* Fixed an issue causing finding references to be wrong in `Function` in `Array`.

# v0.2.0 on 2014/04/25

* Fixed an issue causing stopping highlighting when typing wrong code.
* Skipped key of object literal.
* Skipped key access.

# v0.1.12 on 2014/04/20

* Fixed an issue causing finding references to be wrong when multi scoped symbol.

# v0.1.11 on 2014/04/16

* Fixed an issue causing the highlighting to be wrong when focusing at primitive symbols.
* Added class using when highlighting multi-lines.

# v0.1.10 on 2014/04/16

* Supported `for-in` and `for-of` statement

# v0.1.9 on 2014/04/15

* Fixed error thrown when toggle highlight after closing editor.
* Replaced capture in README.

# v0.1.7-v0.1.8 on 2014/04/15

* Supported highlighting references.

# v0.1.6 on 2014/04/12

* Added capture to README.
* Added descriptions about operation and support to README.

# v0.1.5 on 2014/04/11

* Supported renaming over lexical scope.

# v0.1.3-v0.1.4 on 2014/04/10

* Implemented finding references with `Literal` class.

# v0.1.2 on 2014/04/10

* Supported renaming parameter.
* Supported renaming class name.

# v0.1.1 on 2014/04/09

* Added some specs.
* Supported renaming variable.

# v0.1.0 on 2014/04/09

* Initial release.
* Implement node parser with `coffee.nodes`.
