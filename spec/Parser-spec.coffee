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

    # it "shouldn't parse code with syntax error", ->
  #     expect ->
  #       parser.parse """
  #       a /// b
  #       """
  #     .not.toThrow()
  #     expect(parser.nodes).toBeNull()
  #     expectNoRefs parser, new Range([0, 0], [0, 1])
  #
  # describe 'find', ->
  #
  #   it 'should find no reference in WHITESPACE, OPERATOR', ->
  #     parser.parse """
  #     b = a * b / 10
  #     """
  #     expectNoRefs parser, new Range([0, 1], [0, 2])
  #     expectNoRefs parser, new Range([0, 2], [0, 3])
  #     expectNoRefs parser, new Range([1, 6], [1, 7])
  #
  #   it 'should find no referecene in STRING', ->
  #     parser.parse """
  #     'foo'
  #     "bar"
  #     '''baz'''
  #     """
  #     expectNoRefs parser, new Range([0, 0], [0, 1])
  #     expectNoRefs parser, new Range([0, 1], [0, 2])
  #     expectNoRefs parser, new Range([1, 0], [1, 1])
  #     expectNoRefs parser, new Range([1, 1], [1, 2])
  #     expectNoRefs parser, new Range([2, 0], [2, 1])
  #     expectNoRefs parser, new Range([2, 3], [2, 4])
  #
  #   it 'should find no referecene in NUMBER', ->
  #     parser.parse """
  #     100
  #     0xff
  #     """
  #     expectNoRefs parser, new Range([0, 0], [0, 1])
  #     expectNoRefs parser, new Range([0, 2], [0, 3])
  #     expectNoRefs parser, new Range([1, 0], [1, 1])
  #     expectNoRefs parser, new Range([1, 3], [1, 4])
  #
  #   it 'should find no referecene in Regex', ->
  #     parser.parse """
  #     /foo\s+bar/
  #     ///
  #     foo
  #     \s+
  #     bar
  #     ///
  #     """
  #     expectNoRefs parser, new Range([0, 0], [0, 1])
  #     expectNoRefs parser, new Range([0, 5], [0, 6])
  #     expectNoRefs parser, new Range([1, 0], [1, 1])
  #     expectNoRefs parser, new Range([3, 1], [3, 2])
  #
  #   it 'should support FUNCTION statement', ->
  #     parser.parse """
  #     a = b = 100
  #     calc = (a) ->
  #       a * b
  #     a /= b
  #     """
  #     expectEqualRefs parser, new Range([0, 0], [0, 1]),
  #       new Range([3, 0], [3, 1])
  #     expectEqualRefs parser, new Range([1, 8], [1, 9]),
  #       new Range([2, 2], [2, 3])
  #     expectEqualRefs parser, new Range([2, 2], [2, 3]),
  #       new Range([1, 8], [1, 9])
  #     expectEqualRefs parser, new Range([3, 0], [3, 1]),
  #       new Range([0, 0], [0, 1])
  #     expectEqualRefs parser, new Range([0, 4], [0, 5]),
  #       new Range([2, 6], [2, 7]),
  #       new Range([3, 5], [3, 6])
  #     expectEqualRefs parser, new Range([2, 6], [2, 7]),
  #       new Range([0, 4], [0, 5]),
  #       new Range([3, 5], [3, 6])
  #     expectEqualRefs parser, new Range([3, 5], [3, 6]),
  #       new Range([0, 4], [0, 5]),
  #       new Range([2, 6], [2, 7])
  #
  #   it 'should support FUNCTION scope', ->
  #     parser.parse """
  #     a.forEach (a) ->
  #       a.forEach (a) ->
  #         a * a
  #     """
  #     expectEqualRefs parser, new Range([0, 0], [0, 1])
  #     expectEqualRefs parser, new Range([0, 11], [0, 12]),
  #       new Range([1, 2], [1, 3])
  #     expectEqualRefs parser, new Range([1, 2], [1, 3]),
  #       new Range([0, 11], [0, 12])
  #     expectEqualRefs parser, new Range([1, 13], [1, 14]),
  #       new Range([2, 4], [2, 5]),
  #       new Range([2, 8], [2, 9])
  #     expectEqualRefs parser, new Range([2, 4], [2, 5]),
  #       new Range([1, 13], [1, 14]),
  #       new Range([2, 8], [2, 9])
  #     expectEqualRefs parser, new Range([2, 8], [2, 9]),
  #       new Range([1, 13], [1, 14]),
  #       new Range([2, 4], [2, 5])

    it 'should support OBJECT literal', ->
      parser.parse """
      x = 1
      point = x: x * x
      point.x = 2
      """
      expectEqualRefs parser, new Range([0, 0], [0, 1]),
        new Range([1, 11], [1, 12]),
        new Range([1, 15], [1, 16])
      # expectEqualRefs parser, new Range([1, 11], [1, 12]),
      #   new Range([0, 0], [0, 1]),
      #   new Range([1, 15], [1, 16])
      # expectEqualRefs parser, new Range([1, 11], [1, 12]),
      #   new Range([1, 15], [1, 16]),
      #   new Range([0, 0], [0, 1])

    # it 'should find ref from outer in ARRAY', ->
    #   parser.parse """
    #   a = 10
    #   b = 5
    #   c = [
    #     a + b
    #     a - b
    #   ]
    #   """
    #   expectEqualRefs parser, new Range([0, 0], [0, 1]),
    #     new Range([3, 2], [3, 3]),
    #     new Range([4, 2], [4, 3])
    #   expectEqualRefs parser, new Range([3, 6], [3, 7]),
    #     new Range([1, 0], [1, 1]),
    #     new Range([4, 6], [4, 7])
    #
    # it 'should support EXTENDS statement', ->
    #   parser.parse """
    #   class A
    #   class B extends A
    #   class C extends A
    #   """
    #   expectEqualRefs parser, new Range([0, 6], [0, 7]),
    #     new Range([1, 16], [1, 17]),
    #     new Range([2, 16], [2, 17])
    #   expectEqualRefs parser, new Range([1, 16], [1, 17]),
    #     new Range([0, 6], [0, 7]),
    #     new Range([2, 16], [2, 17])
    #
    # it 'should support IF statement', ->
    #   parser.parse """
    #   if a
    #     a = a / a
    #   """
    #   expectEqualRefs parser, new Range([0, 3], [0, 4]),
    #     new Range([1, 2], [1, 3]),
    #     new Range([1, 6], [1, 7]),
    #     new Range([1, 10], [1, 11])
    #   expectEqualRefs parser, new Range([1, 10], [1, 11]),
    #     new Range([0, 3], [0, 4]),
    #     new Range([1, 2], [1, 3]),
    #     new Range([1, 6], [1, 7])
    #
    # it 'should support FOR-IN statement', ->
    #   parser.parse """
    #   for elem, i in arr
    #     console.log i, elem
    #   """
    #   expectEqualRefs parser, new Range([0, 4], [0, 8]),
    #     new Range([1, 17], [1, 21])
    #   expectEqualRefs parser, new Range([0, 10], [0, 11]),
    #     new Range([1, 14], [1, 15])
    #   expectEqualRefs parser, new Range([1, 17], [1, 21]),
    #     new Range([0, 4], [0, 8])
    #   expectEqualRefs parser, new Range([1, 14], [1, 15]),
    #     new Range([0, 10], [0, 11])
    #
    # it 'should support FOR-OF statement', ->
    #   parser.parse """
    #   for key, val of obj
    #     console.log key, val
    #   """
    #   expectEqualRefs parser, new Range([0, 4], [0, 7]),
    #     new Range([1, 14], [1, 17])
    #   expectEqualRefs parser, new Range([0, 9], [0, 12]),
    #     new Range([1, 19], [1, 22])
    #   expectEqualRefs parser, new Range([1, 14], [1, 17]),
    #     new Range([0, 4], [0, 7])
    #   expectEqualRefs parser, new Range([1, 19], [1, 22]),
    #     new Range([0, 9], [0, 12])
