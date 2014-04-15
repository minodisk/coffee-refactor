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

    it "shouldn't parse code with syntax error", ->
      expect ->
        parser.parse """
        a /// b
        """
      .not.toThrow()
      expect(parser.nodes).toBeNull()
      expectNoRefs parser, new Range([0, 0], [0, 1])

  describe 'find', ->

    it 'should find no reference in WHITESPACE, OPERATOR', ->
      parser.parse """
      b = a * b / 10
      """
      expectNoRefs parser, new Range([0, 1], [0, 2])
      expectNoRefs parser, new Range([0, 2], [0, 3])
      expectNoRefs parser, new Range([1, 6], [1, 7])

    it 'should support FUNCTION statement', ->
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

    it 'should support OBJECT statement', ->
      parser.parse """
      a = 10
      b = 5
      c =
        sum: a + b
        delta: a - b
      """
      expectEqualRefs parser, new Range([0, 0], [0, 1]),
        new Range([3, 7], [3, 8]),
        new Range([4, 9], [4, 10])
      expectEqualRefs parser, new Range([3, 11], [3, 12]),
        new Range([1, 0], [1, 1]),
        new Range([4, 13], [4, 14])

    it 'should find ref from outer in ARRAY', ->
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

    it 'should support EXTENDS statement', ->
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

    it 'should support IF statement', ->
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

    it 'should support FOR-IN statement', ->
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

    it 'should support FOR-OF statement', ->
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
