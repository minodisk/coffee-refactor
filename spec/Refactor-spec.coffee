Refactor = require '../lib/Refactor'
{ Range } = require 'atom'

# Refactor.verbose = true

describe 'Refactor', ->

  describe 'find', ->

    do ->
      refactor = new Refactor """
      a = b = 100
      b = a * b / 10
      """

      it 'should find no reference of whitespace', ->
        refs = refactor.find new Range [0, 1], [0, 2]
        expect(refs).toHaveLength 0

      it 'should find no reference of operator', ->
        refs = refactor.find new Range [0, 2], [0, 3]
        expect(refs).toHaveLength 0
        refs = refactor.find new Range [1, 6], [1, 7]
        expect(refs).toHaveLength 0

      it 'should find a reference of variable', ->
        refs = refactor.find new Range [0, 0], [0, 1]
        expect(refs).toHaveLength 1
        expect(refs[0].range).toEqual new Range [1, 4], [1, 5]

      it 'should find references of variable', ->
        refs = refactor.find new Range [1, 0], [1, 1]
        expect(refs).toHaveLength 2
        expect(refs[0].range).toEqual new Range [0, 4], [0, 5]
        expect(refs[1].range).toEqual new Range [1, 8], [1, 9]

      it 'should find references of value', ->
        refs = refactor.find new Range [1, 8], [1, 9]
        expect(refs).toHaveLength 2
        expect(refs[0].range).toEqual new Range [0, 4], [0, 5]
        expect(refs[1].range).toEqual new Range [1, 0], [1, 1]

    do ->
      refactor = new Refactor """
      a = 100
      b = 3
      calc = (a) ->
        a * b
      pow a
      console.log b
      """

      it 'should find function scoped refs', ->
        refs = refactor.find new Range [2, 8], [2, 9]
        expect(refs).toHaveLength 1
        expect(refs[0].range).toEqual new Range [3, 2], [3, 3]

      it 'should find function external scoped refs', ->
        refs = refactor.find new Range [3, 6], [3, 7]
        expect(refs).toHaveLength 2
        expect(refs[0].range).toEqual new Range [1, 0], [1, 1]
        expect(refs[1].range).toEqual new Range [5, 12], [5, 13]

    do ->
      refactor = new Refactor """
      a = 10
      b = 5
      c =
        sum: a + b
        delta: a - b
      """

      it 'should find ref from outer of object', ->
        refs = refactor.find new Range [0, 0], [0, 1]
        expect(refs).toHaveLength 2
        expect(refs[0].range).toEqual new Range [3, 7], [3, 8]
        expect(refs[1].range).toEqual new Range [4, 9], [4, 10]

      it 'should find ref from inner of object', ->
        refs = refactor.find new Range [3, 11], [3, 12]
        expect(refs).toHaveLength 2
        expect(refs[0].range).toEqual new Range [1, 0], [1, 1]
        expect(refs[1].range).toEqual new Range [4, 13], [4, 14]

    do ->
      refactor = new Refactor """
      a = 10
      b = 5
      c = [
        a + b
        a - b
      ]
      """

      it 'should find ref from outer of array', ->
        refs = refactor.find new Range [0, 0], [0, 1]
        expect(refs).toHaveLength 2
        expect(refs[0].range).toEqual new Range [3, 2], [3, 3]
        expect(refs[1].range).toEqual new Range [4, 2], [4, 3]

      it 'should find ref from inner of array', ->
        refs = refactor.find new Range [3, 6], [3, 7]
        expect(refs).toHaveLength 2
        expect(refs[0].range).toEqual new Range [1, 0], [1, 1]
        expect(refs[1].range).toEqual new Range [4, 6], [4, 7]

    do ->
      refactor = new Refactor """
      class A
      class B extends A
      class C extends A
      """

      it 'should find ref of child class', ->
        refs = refactor.find new Range [0, 6], [0, 7]
        expect(refs).toHaveLength 2
        expect(refs[0].range).toEqual new Range [1, 16], [1, 17]
        expect(refs[1].range).toEqual new Range [2, 16], [2, 17]

      it 'should find ref of extends class', ->
        refs = refactor.find new Range [1, 16], [1, 17]
        expect(refs).toHaveLength 2
        expect(refs[0].range).toEqual new Range [0, 6], [0, 7]
        expect(refs[1].range).toEqual new Range [2, 16], [2, 17]
