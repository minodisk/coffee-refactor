expect = require 'expect.js'
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
        expect(refs).to.have.length 0

      it 'should find no reference of operator', ->
        refs = refactor.find new Range [0, 2], [0, 3]
        expect(refs).to.have.length 0
        refs = refactor.find new Range [1, 6], [1, 7]
        expect(refs).to.have.length 0

      it 'should find a reference of variable', ->
        refs = refactor.find new Range [0, 0], [0, 1]
        expect(refs).to.have.length 1
        expect(refs[0].range.start.row).to.be 1
        expect(refs[0].range.start.column).to.be 4
        expect(refs[0].range.end.row).to.be 1
        expect(refs[0].range.end.column).to.be 5

      it 'should find references of variable', ->
        refs = refactor.find new Range [1, 0], [1, 1]
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 0
        expect(refs[0].range.start.column).to.be 4
        expect(refs[0].range.end.row).to.be 0
        expect(refs[0].range.end.column).to.be 5
        expect(refs[1].range.start.row).to.be 1
        expect(refs[1].range.start.column).to.be 8
        expect(refs[1].range.end.row).to.be 1
        expect(refs[1].range.end.column).to.be 9

      it 'should find references of value', ->
        refs = refactor.find new Range [1, 8], [1, 9]
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 0
        expect(refs[0].range.start.column).to.be 4
        expect(refs[0].range.end.row).to.be 0
        expect(refs[0].range.end.column).to.be 5
        expect(refs[1].range.start.row).to.be 1
        expect(refs[1].range.start.column).to.be 0
        expect(refs[1].range.end.row).to.be 1
        expect(refs[1].range.end.column).to.be 1

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
        expect(refs).to.have.length 1
        expect(refs[0].range.start.row).to.be 3
        expect(refs[0].range.start.column).to.be 2
        expect(refs[0].range.end.row).to.be 3
        expect(refs[0].range.end.column).to.be 3

      it 'should find function external scoped refs', ->
        refs = refactor.find new Range [3, 6], [3, 7]
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 1
        expect(refs[0].range.start.column).to.be 0
        expect(refs[0].range.end.row).to.be 1
        expect(refs[0].range.end.column).to.be 1
        expect(refs[1].range.start.row).to.be 5
        expect(refs[1].range.start.column).to.be 12
        expect(refs[1].range.end.row).to.be 5
        expect(refs[1].range.end.column).to.be 13

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
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 3
        expect(refs[0].range.start.column).to.be 7
        expect(refs[0].range.end.row).to.be 3
        expect(refs[0].range.end.column).to.be 8
        expect(refs[1].range.start.row).to.be 4
        expect(refs[1].range.start.column).to.be 9
        expect(refs[1].range.end.row).to.be 4
        expect(refs[1].range.end.column).to.be 10

      it 'should find ref from inner of object', ->
        refs = refactor.find new Range [3, 11], [3, 12]
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 1
        expect(refs[0].range.start.column).to.be 0
        expect(refs[0].range.end.row).to.be 1
        expect(refs[0].range.end.column).to.be 1
        expect(refs[1].range.start.row).to.be 4
        expect(refs[1].range.start.column).to.be 13
        expect(refs[1].range.end.row).to.be 4
        expect(refs[1].range.end.column).to.be 14

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
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 3
        expect(refs[0].range.start.column).to.be 2
        expect(refs[0].range.end.row).to.be 3
        expect(refs[0].range.end.column).to.be 3
        expect(refs[1].range.start.row).to.be 4
        expect(refs[1].range.start.column).to.be 2
        expect(refs[1].range.end.row).to.be 4
        expect(refs[1].range.end.column).to.be 3

      it 'should find ref from inner of array', ->
        refs = refactor.find new Range [3, 6], [3, 7]
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 1
        expect(refs[0].range.start.column).to.be 0
        expect(refs[0].range.end.row).to.be 1
        expect(refs[0].range.end.column).to.be 1
        expect(refs[1].range.start.row).to.be 4
        expect(refs[1].range.start.column).to.be 6
        expect(refs[1].range.end.row).to.be 4
        expect(refs[1].range.end.column).to.be 7

    do ->
      refactor = new Refactor """
      class A
      class B extends A
      class C extends A
      """

      it 'should find ref of child class', ->
        refs = refactor.find new Range [0, 6], [0, 7]
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 1
        expect(refs[0].range.start.column).to.be 16
        expect(refs[0].range.end.row).to.be 1
        expect(refs[0].range.end.column).to.be 17
        expect(refs[1].range.start.row).to.be 2
        expect(refs[1].range.start.column).to.be 16
        expect(refs[1].range.end.row).to.be 2
        expect(refs[1].range.end.column).to.be 17

      it 'should find ref of extends class', ->
        refs = refactor.find new Range [1, 16], [1, 17]
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 0
        expect(refs[0].range.start.column).to.be 6
        expect(refs[0].range.end.row).to.be 0
        expect(refs[0].range.end.column).to.be 7
        expect(refs[1].range.start.row).to.be 2
        expect(refs[1].range.start.column).to.be 16
        expect(refs[1].range.end.row).to.be 2
        expect(refs[1].range.end.column).to.be 17