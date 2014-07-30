{ Context } = require '../../csrefactor'
{ Range } = require 'atom'

module.exports =
class Ripper

  @referenceToRange: ({loc: { start: { line, column }}, name}) ->
    new Range [ line - 1, column ], [ line - 1, column + name.length ]

  @scopeNames: [
    'source.coffee'
  ]

  parseOptions:
    loc: true
    range: true
    tokens: true
    tolerant: true

  constructor: ->
    @context = new Context

  destruct: ->
    delete @context

  parse: (code, callback) ->
    # try
      @context.setCode code
      rLine = /.*(?:\r?\n|\n?\r)/g
      @lines = (result[0].length while (result = rLine.exec code)?)
      callback? null
    # catch err
    #   console.log err
    #   callback? null
      # callback? err

  find: ({ row, column }) ->
    console.log row, column
    pos = 0
    while --row >= 0
      pos += @lines[row]
    pos += column
    console.log pos

    identification = @context.identify pos
    return [] unless identification

    { declaration, references } = identification
    # if declaration?
    #   references.unshift declaration
    console.log  references
    ranges = []
    for reference in references
      ranges.push Ripper.referenceToRange reference
    ranges
