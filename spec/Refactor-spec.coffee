Parser = require '../lib/Parser'
{ Range } = require 'atom'

expectEqualRefs = (parser, range, ranges...) ->
  nodes = parser.find range
  expect nodes
  .toHaveLength ranges.length
  for node, i in nodes
    expect node.locationData
    .toEqual Parser.rangeToLocationData ranges[i]


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
      expectEqualRefs parser, new Range([0, 0], [0, 1])

  describe 'find', ->

    it 'should find no reference in WHITESPACE, OPERATOR', ->
      parser.parse """
      b = a * b / 10
      """
      expectEqualRefs parser, new Range([0, 1], [0, 2])
      expectEqualRefs parser, new Range([0, 2], [0, 3])
      expectEqualRefs parser, new Range([1, 6], [1, 7])

    it 'should find references in FUNCTION', ->
      parser.parse """
      a = 100
      b = 3
      calc = (a) ->
        a * b
      pow a
      console.log b
      """
      expectEqualRefs parser, new Range([2, 8], [2, 9]),
        new Range([3, 2], [3, 3])
      expectEqualRefs parser, new Range([3, 6], [3, 7]),
        new Range([1, 0], [1, 1]),
        new Range([5, 12], [5, 13])

    it 'should find references in OBJECT', ->
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

    it 'should find references in EXTENDS', ->
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

    it 'should find references in IF', ->
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
