Parser = require '../lib/Parser'
{ Range } = require 'atom'
# { inspect } = require 'util'

expectNoRefs = (parser, range) ->
  resultRanges = parser.find range
  expect resultRanges
  .toHaveLength 0

expectEqualRefs = (parser, ranges...) ->
  resultRanges = parser.find ranges[0]
  ranges.sort (a, b) ->
    return delta if (delta = a.start.row - b.start.row) isnt 0
    a.start.column - b.start.column

  expect resultRanges
  .toHaveLength ranges.length
  for resultRange, i in resultRanges
    expect resultRange
    .toEqual ranges[i]


describe 'Parser', ->

  parser = new Parser

  describe 'parse', ->

   it 'should run without error when parse invalid code', ->
      expect ->
        parser.parse """
        a /// b
        """
      .not.toThrow()
      expect ->
        parser.find new Range([0, 0], [0, 1])
      .not.toThrow()
      expectNoRefs parser, new Range([0, 0], [0, 1])

  describe 'find', ->

    it 'should find no reference of whitespace or operator', ->
      parser.parse """
      b = a * b / 10
      """
      expectNoRefs parser, new Range([0, 1], [0, 2])
      expectNoRefs parser, new Range([0, 2], [0, 3])
      expectNoRefs parser, new Range([1, 6], [1, 7])

    it 'should find no referecene of `String` literal', ->
      parser.parse """
      'foo'
      "bar"
      '''baz'''
      """
      expectNoRefs parser, new Range([0, 0], [0, 1])
      expectNoRefs parser, new Range([0, 1], [0, 2])
      expectNoRefs parser, new Range([1, 0], [1, 1])
      expectNoRefs parser, new Range([1, 1], [1, 2])
      expectNoRefs parser, new Range([2, 0], [2, 1])
      expectNoRefs parser, new Range([2, 3], [2, 4])

    it 'should find no referecene of `Number` literal', ->
      parser.parse """
      100
      0xff
      """
      expectNoRefs parser, new Range([0, 0], [0, 1])
      expectNoRefs parser, new Range([0, 2], [0, 3])
      expectNoRefs parser, new Range([1, 0], [1, 1])
      expectNoRefs parser, new Range([1, 3], [1, 4])

    it 'should find no referecene of `Regex` literal', ->
      parser.parse """
      /foo\s+bar/
      ///
      foo
      \s+
      bar
      ///
      """
      expectNoRefs parser, new Range([0, 0], [0, 1])
      expectNoRefs parser, new Range([0, 5], [0, 6])
      expectNoRefs parser, new Range([1, 0], [1, 1])
      expectNoRefs parser, new Range([3, 1], [3, 2])

    it 'should support `Object` literal', ->
      parser.parse """
      x = 2
      point =
        x:
          x: x * x
      point.x = 100
      """
      expectNoRefs parser, new Range([2, 2], [2, 3])
      expectNoRefs parser, new Range([3, 4], [3, 5])
      expectNoRefs parser, new Range([4, 6], [4, 7])
      expectEqualRefs parser, new Range([0, 0], [0, 1]),
        new Range([3, 7], [3, 8]),
        new Range([3, 11], [3, 12])
      expectEqualRefs parser, new Range([3, 7], [3, 8]),
        new Range([0, 0], [0, 1]),
        new Range([3, 11], [3, 12])
      expectEqualRefs parser, new Range([3, 11], [3, 12]),
        new Range([0, 0], [0, 1]),
        new Range([3, 7], [3, 8])

    it 'should support `Array` literal', ->
      parser.parse """
      a = 10
      b = 5
      c = [
        a + b
        a - b
      ]
      """
      expectEqualRefs parser, new Range([0, 0], [0, 1]),
        new Range([3, 2], [3, 3]),
        new Range([4, 2], [4, 3])
      expectEqualRefs parser, new Range([3, 6], [3, 7]),
        new Range([1, 0], [1, 1]),
        new Range([4, 6], [4, 7])

    it 'should support `extends` statement', ->
      parser.parse """
      class A
      class B extends A
      class C extends A
      """
      expectEqualRefs parser, new Range([0, 6], [0, 7]),
        new Range([1, 16], [1, 17]),
        new Range([2, 16], [2, 17])
      expectEqualRefs parser, new Range([1, 16], [1, 17]),
        new Range([0, 6], [0, 7]),
        new Range([2, 16], [2, 17])

    it 'should support `if` statement', ->
      parser.parse """
      if a
        a = a / a
      """
      expectEqualRefs parser, new Range([0, 3], [0, 4]),
        new Range([1, 2], [1, 3]),
        new Range([1, 6], [1, 7]),
        new Range([1, 10], [1, 11])
      expectEqualRefs parser, new Range([1, 10], [1, 11]),
        new Range([0, 3], [0, 4]),
        new Range([1, 2], [1, 3]),
        new Range([1, 6], [1, 7])

    it 'should support `for-of` statement', ->
      parser.parse """
      for elem, i in arr
        console.log i, elem
      """
      expectEqualRefs parser, new Range([0, 4], [0, 8]),
        new Range([1, 17], [1, 21])
      expectEqualRefs parser, new Range([0, 10], [0, 11]),
        new Range([1, 14], [1, 15])
      expectEqualRefs parser, new Range([1, 17], [1, 21]),
        new Range([0, 4], [0, 8])
      expectEqualRefs parser, new Range([1, 14], [1, 15]),
        new Range([0, 10], [0, 11])

    it 'should support `for-of` statement', ->
      parser.parse """
      for key, val of obj
        console.log key, val
      """
      expectEqualRefs parser, new Range([0, 4], [0, 7]),
        new Range([1, 14], [1, 17])
      expectEqualRefs parser, new Range([0, 9], [0, 12]),
        new Range([1, 19], [1, 22])
      expectEqualRefs parser, new Range([1, 14], [1, 17]),
        new Range([0, 4], [0, 7])
      expectEqualRefs parser, new Range([1, 19], [1, 22]),
        new Range([0, 9], [0, 12])

    it 'should support destructuring assignment statement of `Array`', ->
      parser.parse """
      a = b = c = 1
      [ a, [ b, c ] ] = obj
      func = ([ a, [ b, c ] ]) ->
        a = b = c = 2
      """
      expectEqualRefs parser, new Range([0, 0], [0, 1]),
        new Range([1, 2], [1, 3])
      expectEqualRefs parser, new Range([1, 2], [1, 3]),
        new Range([0, 0], [0, 1])
      expectEqualRefs parser, new Range([0, 4], [0, 5]),
        new Range([1, 7], [1, 8])
      expectEqualRefs parser, new Range([1, 7], [1, 8]),
        new Range([0, 4], [0, 5])
      expectEqualRefs parser, new Range([0, 8], [0, 9]),
        new Range([1, 10], [1, 11])
      expectEqualRefs parser, new Range([1, 10], [1, 11]),
        new Range([0, 8], [0, 9])
      expectEqualRefs parser, new Range([2, 10], [2, 11]),
        new Range([3, 2], [3, 3])
      expectEqualRefs parser, new Range([3, 2], [3, 3]),
        new Range([2, 10], [2, 11])
      expectEqualRefs parser, new Range([2, 15], [2, 16]),
        new Range([3, 6], [3, 7])
      expectEqualRefs parser, new Range([2, 18], [2, 19]),
        new Range([3, 10], [3, 11])

    it 'should support destructuring assignment statement of `Object`', ->
      parser.parse """
      a = b = c = 1
      { a: { b: c } } = obj
      func = ({ a: { b: c } }) ->
        a = b = c = 2
      func = ({ a }) ->
        a 1
      """
      expectNoRefs parser, new Range([1, 2], [1, 3])
      expectNoRefs parser, new Range([1, 7], [1, 8])
      expectNoRefs parser, new Range([2, 10], [2, 11])
      expectNoRefs parser, new Range([2, 15], [2, 16])
      expectEqualRefs parser, new Range([0, 0], [0, 1]),
        new Range([3, 2], [3, 3])
      expectEqualRefs parser, new Range([3, 2], [3, 3]),
        new Range([0, 0], [0, 1])
      expectEqualRefs parser, new Range([0, 4], [0, 5]),
        new Range([3, 6], [3, 7])
      expectEqualRefs parser, new Range([3, 6], [3, 7]),
        new Range([0, 4], [0, 5])
      expectEqualRefs parser, new Range([0, 8], [0, 9]),
        new Range([1, 10], [1, 11])
      expectEqualRefs parser, new Range([1, 10], [1, 11]),
        new Range([0, 8], [0, 9])
      expectEqualRefs parser, new Range([2, 18], [2, 19]),
        new Range([3, 10], [3, 11])
      expectEqualRefs parser, new Range([3, 10], [3, 11]),
        new Range([2, 18], [2, 19])
      expectEqualRefs parser, new Range([4, 10], [4, 11]),
        new Range([5, 2], [5, 3])
      expectEqualRefs parser, new Range([5, 2], [5, 3]),
        new Range([4, 10], [4, 11])


    it 'should recognize the scope of variable', ->
      parser.parse """
      a = b = 100
      calc = (a) ->
        a * b
      a /= b
      """
      expectEqualRefs parser, new Range([0, 0], [0, 1]),
        new Range([3, 0], [3, 1])
      expectEqualRefs parser, new Range([1, 8], [1, 9]),
        new Range([2, 2], [2, 3])
      expectEqualRefs parser, new Range([2, 2], [2, 3]),
        new Range([1, 8], [1, 9])
      expectEqualRefs parser, new Range([3, 0], [3, 1]),
        new Range([0, 0], [0, 1])
      expectEqualRefs parser, new Range([0, 4], [0, 5]),
        new Range([2, 6], [2, 7]),
        new Range([3, 5], [3, 6])
      expectEqualRefs parser, new Range([2, 6], [2, 7]),
        new Range([0, 4], [0, 5]),
        new Range([3, 5], [3, 6])
      expectEqualRefs parser, new Range([3, 5], [3, 6]),
        new Range([0, 4], [0, 5]),
        new Range([2, 6], [2, 7])

    it 'should recognize nested scope', ->
      parser.parse """
      a.forEach (a) ->
        a.forEach (a) ->
          a * a
      """
      expectEqualRefs parser, new Range([0, 0], [0, 1])
      expectEqualRefs parser, new Range([0, 11], [0, 12]),
        new Range([1, 2], [1, 3])
      expectEqualRefs parser, new Range([1, 2], [1, 3]),
        new Range([0, 11], [0, 12])
      expectEqualRefs parser, new Range([1, 13], [1, 14]),
        new Range([2, 4], [2, 5]),
        new Range([2, 8], [2, 9])
      expectEqualRefs parser, new Range([2, 4], [2, 5]),
        new Range([1, 13], [1, 14]),
        new Range([2, 8], [2, 9])
      expectEqualRefs parser, new Range([2, 8], [2, 9]),
        new Range([1, 13], [1, 14]),
        new Range([2, 4], [2, 5])

    it 'should recognize declared variable in independent scopes', ->
      parser.parse """
      func0 = ->
        a = 100
      func1 = ->
        a = 100
      """
      expectEqualRefs parser, new Range([1, 2], [1, 3])
      expectEqualRefs parser, new Range([3, 2], [3, 3])

    it 'should recognize scope of `Function` in `Array`', ->
      parser.parse """
      [
        (a) ->
          a 1
        (a) ->
          a 2
      ]
      """
      expectEqualRefs parser, new Range([1, 3], [1, 4]),
        new Range([2, 4], [2, 5])
      expectEqualRefs parser, new Range([2, 4], [2, 5]),
        new Range([1, 3], [1, 4])
      expectEqualRefs parser, new Range([3, 3], [3, 4]),
        new Range([4, 4], [4, 5])
      expectEqualRefs parser, new Range([4, 4], [4, 5]),
        new Range([3, 3], [3, 4])
