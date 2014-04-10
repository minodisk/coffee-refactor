coffee = require 'coffee-script'
{ Literal } = require '../node_modules/coffee-script/lib/coffee-script/nodes'
{ Range } = require 'atom'

# _ = require 'underscore'
# { inspect } = require 'util'


pad = (str, len, pad = ' ') ->
  while str.length < len
    str += pad
  str

padL = (str, len, pad = ' ') ->
  while str.length < len
    str = pad + str
  str


module.exports = class Parser

  @locationDataToRange: ({ first_line, first_column, last_line, last_column }) ->
    new Range [ first_line, first_column ], [ last_line, last_column + 1 ]

  @rangeToLocationData: ({ start, end }) ->
    first_line  : start.row
    first_column: start.column
    last_line   : end.row
    last_column : end.column - 1

  @isEqualLocationData: (a, b) ->
    a.first_line   is b.first_line   and \
    a.first_column is b.first_column and \
    a.last_line    is b.last_line    and \
    a.last_column  is b.last_column


  constructor: (code) ->
    @block = coffee.nodes code

  find: (range) ->
    targetLocationData = Parser.rangeToLocationData range
    target = @block.contains (node) ->
      node instanceof Literal and Parser.isEqualLocationData node.locationData, targetLocationData

    return [] unless target?

    refs = []
    @block.traverseChildren no, (node) ->
      if node instanceof Literal and node isnt target and node.value is target.value
        refs.push node
    refs
