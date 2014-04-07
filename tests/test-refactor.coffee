expect = require 'expect.js'
{ Refactor } = require '../lib/Refactor'

describe 'Refactor', ->

  describe 'find', ->

    do ->
      Refactor.verbose = true
      refactor = new Refactor """
      a = b = 100
      b = a * b / 10
      """

      it 'should find no reference of whitespace', ->
        refs = refactor.find
          start:
            row: 0
            column: 1
          end:
            row: 0
            column: 2
        expect(refs).to.have.length 0

      it 'should find no reference of operator', ->
        refs = refactor.find
          start:
            row: 0
            column: 2
          end:
            row: 0
            column: 3
        expect(refs).to.have.length 0
        refs = refactor.find
          start:
            row: 1
            column: 6
          end:
            row: 1
            column: 7
        expect(refs).to.have.length 0

      it 'should find a reference of variable', ->
        refs = refactor.find
          start:
            row: 0
            column: 0
          end:
            row: 0
            column: 1
        expect(refs).to.have.length 1
        expect(refs[0].range.start.row).to.be 1
        expect(refs[0].range.start.column).to.be 4
        expect(refs[0].range.end.row).to.be 1
        expect(refs[0].range.end.column).to.be 5

      it 'should find references of variable', ->
        refs = refactor.find
          start:
            row: 1
            column: 0
          end:
            row: 1
            column: 1
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
        refs = refactor.find
          start:
            row: 1
            column: 8
          end:
            row: 1
            column: 9
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
      pow = (a) ->
        a * a
      pow a
      """

      it 'should find function scoped refs', ->
        refs = refactor.find
          start:
            row: 1
            column: 7
          end:
            row: 1
            column: 8
        expect(refs).to.have.length 2
        expect(refs[0].range.start.row).to.be 2
        expect(refs[0].range.start.column).to.be 2
        expect(refs[0].range.end.row).to.be 2
        expect(refs[0].range.end.column).to.be 3
        expect(refs[1].range.start.row).to.be 2
        expect(refs[1].range.start.column).to.be 6
        expect(refs[1].range.end.row).to.be 2
        expect(refs[1].range.end.column).to.be 7
