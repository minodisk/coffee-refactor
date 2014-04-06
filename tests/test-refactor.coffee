expect = require 'expect.js'
Refactor = require '../lib/Refactor'

describe 'refactor', ->

  describe 'find', ->

    describe 'simple refs', ->

      refactor = new Refactor """
      a = b = 100
      b = a * b / 10
      """

      it 'should find no reference when specified blank', ->
        refs = refactor.find
          start:
            row: 0
            column: 1
          end:
            row: 0
            column: 2
        expect(refs).to.have.length 0

      it 'should find no reference when specified operator', ->
        refs = refactor.find
          start:
            row: 0
            column: 2
          end:
            row: 0
            column: 3
        expect(refs).to.have.length 0

      it 'should find no reference when specified operator', ->
        refs = refactor.find
          start:
            row: 1
            column: 6
          end:
            row: 1
            column: 7
        expect(refs).to.have.length 0

      it 'should find a reference when specified variable', ->
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

      it 'should find references when specified variable', ->
        refs = refactor.find
          start:
            row: 1
            column: 0
          end:
            row: 1
            column: 1
        expect(refs).to.have.length 3
        # expect(refs[0].range.start.row).to.be 1
        # expect(refs[0].range.start.column).to.be 4
        # expect(refs[0].range.end.row).to.be 1
        # expect(refs[0].range.end.column).to.be 5
