Refactor = require '../lib/Refactor'
{ Range } = require 'atom'

expectEqualRefs = (refactor, range, ranges...) ->
  nodes = refactor.find range
  expect nodes
  .toHaveLength ranges.length
  for node, i in nodes
    expect node.locationData
    .toEqual Refactor.rangeToLocationData ranges[i]

describe 'Refactor', ->

  describe 'find', ->

    it 'should find no reference in WHITESPACE, OPERATOR', ->
      refactor = new Refactor """
      b = a * b / 10
      """
      expectEqualRefs refactor, new Range([0, 1], [0, 2])
      expectEqualRefs refactor, new Range([0, 2], [0, 3])
      expectEqualRefs refactor, new Range([1, 6], [1, 7])

    it 'should find references in FUNCTION', ->
      refactor = new Refactor """
      a = 100
      b = 3
      calc = (a) ->
        a * b
      pow a
      console.log b
      """
      expectEqualRefs refactor, new Range([2, 8], [2, 9]),
        new Range([3, 2], [3, 3])
      expectEqualRefs refactor, new Range([3, 6], [3, 7]),
        new Range([1, 0], [1, 1]),
        new Range([5, 12], [5, 13])

    it 'should find references in OBJECT', ->
      refactor = new Refactor """
      a = 10
      b = 5
      c =
        sum: a + b
        delta: a - b
      """
      expectEqualRefs refactor, new Range([0, 0], [0, 1]),
        new Range([3, 7], [3, 8]),
        new Range([4, 9], [4, 10])
      expectEqualRefs refactor, new Range([3, 11], [3, 12]),
        new Range([1, 0], [1, 1]),
        new Range([4, 13], [4, 14])

    it 'should find ref from outer in ARRAY', ->
      refactor = new Refactor """
      a = 10
      b = 5
      c = [
        a + b
        a - b
      ]
      """
      expectEqualRefs refactor, new Range([0, 0], [0, 1]),
        new Range([3, 2], [3, 3]),
        new Range([4, 2], [4, 3])
      expectEqualRefs refactor, new Range([3, 6], [3, 7]),
        new Range([1, 0], [1, 1]),
        new Range([4, 6], [4, 7])

    it 'should find references in EXTENDS', ->
      refactor = new Refactor """
      class A
      class B extends A
      class C extends A
      """
      expectEqualRefs refactor, new Range([0, 6], [0, 7]),
        new Range([1, 16], [1, 17]),
        new Range([2, 16], [2, 17])
      expectEqualRefs refactor, new Range([1, 16], [1, 17]),
        new Range([0, 6], [0, 7]),
        new Range([2, 16], [2, 17])

    it 'should find references in IF', ->
      refactor = new Refactor """
      if a
        a = a / a
      """
      expectEqualRefs refactor, new Range([0, 3], [0, 4]),
        new Range([1, 2], [1, 3]),
        new Range([1, 6], [1, 7]),
        new Range([1, 10], [1, 11])
      expectEqualRefs refactor, new Range([1, 10], [1, 11]),
        new Range([0, 3], [0, 4]),
        new Range([1, 2], [1, 3]),
        new Range([1, 6], [1, 7])
