{ Ripper } = require '../lib/coffee_refactor'
{ Range } = require 'atom'

expectNoRefs = (ripper, range) ->
  resultRanges = ripper.find range
  expect resultRanges
  .toHaveLength 0

expectEqualRefs = (ripper, ranges...) ->
  for range, i in ranges
    newRanges = ranges.slice()
    newRanges.splice i, 1
    newRanges.unshift range
    assertRange ripper, newRanges

assertRange = (ripper, ranges) ->
  assertPoint ripper, ranges[0].start, ranges
  assertPoint ripper, ranges[0].end, ranges

assertPoint = (ripper, point, ranges) ->
  resultRanges = ripper.find point
  ranges.sort (a, b) ->
    return delta if (delta = a.start.row - b.start.row) isnt 0
    a.start.column - b.start.column
  expect resultRanges
  .toHaveLength ranges.length
  for resultRange, i in resultRanges
    expect resultRange
    .toEqual ranges[i]


describe 'Ripper', ->

  describe 'parse', ->

    ripper = new Ripper

    it 'should not throw error if code is invalid', ->
      expect ->
        ripper.parse """
        a /// b
        """
      .not.toThrow()
      expect ->
        ripper.find new Range([0, 0], [0, 1])
      .not.toThrow()
      expectNoRefs ripper, new Range([0, 0], [0, 1])

  describe 'find', ->

    ripper = new Ripper

    it 'should find no reference of whitespace or operator', ->
      ripper.parse """
      b = a * b / 10
      """
      expectNoRefs ripper, new Range([0, 1], [0, 2])
      expectNoRefs ripper, new Range([0, 2], [0, 3])
      expectNoRefs ripper, new Range([1, 6], [1, 7])

    it 'should find no referecene of `String` literal', ->
      ripper.parse """
      'foo'
      "bar"
      '''baz'''
      """
      expectNoRefs ripper, new Range([0, 0], [0, 1])
      expectNoRefs ripper, new Range([0, 1], [0, 2])
      expectNoRefs ripper, new Range([1, 0], [1, 1])
      expectNoRefs ripper, new Range([1, 1], [1, 2])
      expectNoRefs ripper, new Range([2, 0], [2, 1])
      expectNoRefs ripper, new Range([2, 3], [2, 4])

    it 'should find no referecene of `Number` literal', ->
      ripper.parse """
      100
      0xff
      """
      expectNoRefs ripper, new Range([0, 0], [0, 1])
      expectNoRefs ripper, new Range([0, 2], [0, 3])
      expectNoRefs ripper, new Range([1, 0], [1, 1])
      expectNoRefs ripper, new Range([1, 3], [1, 4])

    it 'should find no referecene of `Regex` literal', ->
      ripper.parse """
      /foo\s+bar/
      ///
      foo
      \s+
      bar
      ///
      """
      expectNoRefs ripper, new Range([0, 0], [0, 1])
      expectNoRefs ripper, new Range([0, 5], [0, 6])
      expectNoRefs ripper, new Range([1, 0], [1, 1])
      expectNoRefs ripper, new Range([3, 1], [3, 2])

    it 'should support `Object` literal', ->
      ripper.parse """
      x = 2
      point =
        x:
          x: x * x
      point.x = 100
      """
      expectNoRefs ripper, new Range([2, 2], [2, 3])
      expectNoRefs ripper, new Range([3, 4], [3, 5])
      expectNoRefs ripper, new Range([4, 6], [4, 7])
      expectEqualRefs ripper,
        new Range([0, 0], [0, 1]),
        new Range([3, 7], [3, 8]),
        new Range([3, 11], [3, 12])

    it 'should support `Array` literal', ->
      ripper.parse """
      a = 10
      b = 5
      c = [
        a + b
        a - b
      ]
      """
      expectEqualRefs ripper,
        new Range([0, 0], [0, 1]),
        new Range([3, 2], [3, 3]),
        new Range([4, 2], [4, 3])
      expectEqualRefs ripper,
        new Range([3, 6], [3, 7]),
        new Range([1, 0], [1, 1]),
        new Range([4, 6], [4, 7])

    it 'should support `extends` statement', ->
      ripper.parse """
      class A
      class B extends A
      class C extends A
      """
      expectEqualRefs ripper,
        new Range([0, 6], [0, 7]),
        new Range([1, 16], [1, 17]),
        new Range([2, 16], [2, 17])

    it 'should support `if` statement', ->
      ripper.parse """
      if a
        a = a / a
      """
      expectEqualRefs ripper,
        new Range([0, 3], [0, 4]),
        new Range([1, 2], [1, 3]),
        new Range([1, 6], [1, 7]),
        new Range([1, 10], [1, 11])

    it 'should support `for-in` statement without index', ->
      ripper.parse """
      for variable in variables
        console.log variable
      """
      expectEqualRefs ripper,
        new Range([0, 4], [0, 12]),
        new Range([1, 14], [1, 22])

    it 'should support `for-in` statement with index', ->
      ripper.parse """
      for elem, i in arr
        console.log i, elem
      """
      expectEqualRefs ripper,
        new Range([0, 4], [0, 8]),
        new Range([1, 17], [1, 21])
      expectEqualRefs ripper,
        new Range([0, 10], [0, 11]),
        new Range([1, 14], [1, 15])

    it 'should support `for-in` statement with destructuring assignment', ->
      ripper.parse """
      for { a } in arr
        a = 100
      for [ a ] in arr
        a = 100
      """
      expectEqualRefs ripper,
        new Range([0, 6], [0, 7]),
        new Range([1, 2], [1, 3]),
        new Range([2, 6], [2, 7]),
        new Range([3, 2], [3, 3])

    it 'should support `for-of` statement', ->
      ripper.parse """
      for key, val of obj
        console.log key, val
      """
      expectEqualRefs ripper,
        new Range([0, 4], [0, 7]),
        new Range([1, 14], [1, 17])
      expectEqualRefs ripper,
        new Range([0, 9], [0, 12]),
        new Range([1, 19], [1, 22])

    it 'should support `for-of` statement with destructuring assignment', ->
      ripper.parse """
      for i, { a } of obj
        a = 100
      for i, [ a ] of obj
        a = 100
      """
      expectEqualRefs ripper,
        new Range([0, 9], [0, 10]),
        new Range([1, 2], [1, 3]),
        new Range([2, 9], [2, 10]),
        new Range([3, 2], [3, 3])

    it 'should support destructuring assignment statement of `Array`', ->
      ripper.parse """
      a = b = c = 1
      [ a, [ b, c ] ] = obj
      func = ([ a, [ b, c ] ]) ->
        a = b = c = 2
      """
      expectEqualRefs ripper,
        new Range([0, 0], [0, 1]),
        new Range([1, 2], [1, 3])
      expectEqualRefs ripper,
        new Range([0, 4], [0, 5]),
        new Range([1, 7], [1, 8])
      expectEqualRefs ripper,
        new Range([0, 8], [0, 9]),
        new Range([1, 10], [1, 11])
      expectEqualRefs ripper,
        new Range([2, 10], [2, 11]),
        new Range([3, 2], [3, 3])
      expectEqualRefs ripper,
        new Range([2, 15], [2, 16]),
        new Range([3, 6], [3, 7])
      expectEqualRefs ripper,
        new Range([2, 18], [2, 19]),
        new Range([3, 10], [3, 11])

    it 'should support destructuring assignment statement of `Object`', ->
      ripper.parse """
      a = b = c = d = 1
      { a: { b: c }, d } = obj
      func = ({ a: { b: c } }) ->
        a = b = c = 2
      """
      expectNoRefs ripper, new Range([1, 2], [1, 3])
      expectNoRefs ripper, new Range([1, 7], [1, 8])
      expectNoRefs ripper, new Range([2, 10], [2, 11])
      expectNoRefs ripper, new Range([2, 15], [2, 16])
      expectEqualRefs ripper,
        new Range([0, 0], [0, 1]),
        new Range([3, 2], [3, 3])
      expectEqualRefs ripper,
        new Range([0, 4], [0, 5]),
        new Range([3, 6], [3, 7])
      expectEqualRefs ripper,
        new Range([0, 8], [0, 9]),
        new Range([1, 10], [1, 11])
      expectEqualRefs ripper,
        new Range([0, 12], [0, 13]),
        new Range([1, 15], [1, 16])
      expectEqualRefs ripper,
        new Range([2, 18], [2, 19]),
        new Range([3, 10], [3, 11])

    it 'shoud work in construction of `Array`', ->
      ripper.parse """
      a = 1
      [ a ]
      """
      expectEqualRefs ripper,
        new Range([0, 0], [0, 1]),
        new Range([1, 2], [1, 3])

    it 'shoud work in construction of `Object`', ->
      ripper.parse """
      a = 1
      { a }
      """
      expectEqualRefs ripper,
        new Range([0, 0], [0, 1]),
        new Range([1, 2], [1, 3])

    it 'should recognize the scope of variable', ->
      ripper.parse """
      a = b = 100
      calc = (a) ->
        a * b
      a /= b
      """
      expectEqualRefs ripper, new Range([0, 0], [0, 1]),
        new Range([3, 0], [3, 1])
      expectEqualRefs ripper,
        new Range([1, 8], [1, 9]),
        new Range([2, 2], [2, 3])
      expectEqualRefs ripper,
        new Range([0, 4], [0, 5]),
        new Range([2, 6], [2, 7]),
        new Range([3, 5], [3, 6])

    it 'should recognize nested scope with param', ->
      ripper.parse """
      a.forEach (a) ->
        a.forEach (a) ->
          a * a
      """
      expectEqualRefs ripper, new Range([0, 0], [0, 1])
      expectEqualRefs ripper,
        new Range([1, 2], [1, 3]),
        new Range([0, 11], [0, 12])
      expectEqualRefs ripper,
        new Range([1, 13], [1, 14]),
        new Range([2, 4], [2, 5]),
        new Range([2, 8], [2, 9])

    it 'should recognize nested scope with variable', ->
      ripper.parse """
      func0 = ->
        a = 100
        func1 = ->
          a = 200
        func2 = ->
          a = 300
      """
      expectEqualRefs ripper,
        new Range([1, 2], [1, 3]),
        new Range([3, 4], [3, 5]),
        new Range([5, 4], [5, 5])

    it 'should recognize declared variable in independent scopes', ->
      ripper.parse """
      func0 = ->
        a = 100
      func1 = ->
        a = 100
      """
      expectEqualRefs ripper, new Range([1, 2], [1, 3])
      expectEqualRefs ripper, new Range([3, 2], [3, 3])

    it 'should recognize scope of `Function` in `Array`', ->
      ripper.parse """
      [
        (a) ->
          a 1
        (a) ->
          a 2
      ]
      """
      expectEqualRefs ripper,
        new Range([1, 3], [1, 4]),
        new Range([2, 4], [2, 5])
      expectEqualRefs ripper,
        new Range([3, 3], [3, 4]),
        new Range([4, 4], [4, 5])

    it 'should support double quoted string interpolation', ->
      ripper.parse '''
      a
      "#{a}"
      "x#{a}"
      "
      #{a}
      "
      "x
      #{a}
      "
      '''
      expectEqualRefs ripper,
        new Range([0, 0], [0, 1]),
        new Range([1, 3], [1, 4]),
        new Range([2, 4], [2, 5]),
        new Range([4, 2], [4, 3]),
        new Range([7, 2], [7, 3])

    it 'should support triple quoted string interpolation', ->
      ripper.parse '''
      a
      """#{a}"""
      """x#{a}"""
      """
      #{a}
      """
      """x
      #{a}
      """
      '''
      expectEqualRefs ripper,
        new Range([0, 0], [0, 1]),
        new Range([1, 5], [1, 6]),
        new Range([2, 6], [2, 7]),
        new Range([4, 2], [4, 3]),
        new Range([7, 2], [7, 3])

    it 'should support heregex interpolation', ->
      ripper.parse '''
      a
      ///#{a}///
      ///x#{a}///
      ///
      #{a}
      ///
      ///x
      #{a}
      ///
      '''
      expectEqualRefs ripper,
        new Range([0, 0], [0, 1]),
        new Range([1, 5], [1, 6]),
        new Range([2, 6], [2, 7]),
        new Range([4, 2], [4, 3]),
        new Range([7, 2], [7, 3])

    it 'should support symbol starting with $', ->
      ripper.parse '''
      $a = $ '<p>foo</p>'
      $a.text()
      '''
      expectEqualRefs ripper,
        new Range([0, 0], [0, 2]),
        new Range([1, 0], [1, 2])

    it 'should support symbol starting with _', ->
      ripper.parse '''
      _a = 1
      _a += 2
      '''
      expectEqualRefs ripper,
        new Range([0, 0], [0, 2]),
        new Range([1, 0], [1, 2])

    it 'should explode interspersed JS', ->
      ripper.parse '''
      a = 10
      `
      a = 20;
      `
      '''
      expectNoRefs ripper, new Range([2, 0], [2, 1])

    # FEATURE
    # it 'should recognize context', ->
    #   ripper.parse """
    #   obj.a.b = 1
    #   obj.a.b = 2
    #   """
    #   expectEqualRefs ripper, new Range([0, 6], [0, 7]),
    #     new Range([1, 6], [1, 7])
    #   expectEqualRefs ripper, new Range([1, 4], [1, 5]),
    #     new Range([0, 4], [0, 5])
