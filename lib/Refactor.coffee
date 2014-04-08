coffee = require 'coffee-script'
_ = require 'underscore'
{ inspect } = require 'util'

pad = (str, len, pad = ' ') ->
  while str.length < len
    str += pad
  str


exports.Refactor = class Refactor

  constructor: (code) ->
    @node = new Node coffee.nodes code

  find: (range) ->
    return [] unless range?
    @node.find Range.createWithAtomRange range

class Node

  constructor: ({
    locationData
    parent
    body
    expressions
    params
    args
    properties
    objects
    variable
    value
    first
    second
    base
    name
  }, @parentNode, @depth = 0, @type = 'body') ->

    @isRoot = !@parentNode?
    @hasScope = @isRoot or body?
    @range = Range.createWithLocationData locationData
    @children = []
    @params = []

    if Refactor.verbose and @isRoot
      console.log pad '', 50, '='

    if @hasScope
      # @depth++
      if Refactor.verbose
        console.log "#{pad '', 15}|#{pad 'SCOPE', 10}|#{@getIndent()}-"

    if params?
      nodes = (new Node param, @, @depth + 1, 'param' for param in params)
      @children = @children.concat nodes
      @params = @params.concat nodes

    if variable?
      @children.push new Node variable, @, @depth, 'variable'
    if expressions?
      @children = @children.concat new Node expression, @, @depth, 'expression' for expression in expressions
    if args?
      @children = @children.concat new Node arg, @, @depth, 'arg' for arg in args
    # if properties?
    #   @children = @children.concat new Node property, @, @depth, 'property' for property in properties
    if objects?
      @children = @children.concat new Node object, @, @depth, 'object' for object in objects
    if value?
      @children.push new Node value, @, @depth, 'value'
    if first?
      @children.push new Node first, @, @depth, 'first'
    if second?
      @children.push new Node second, @, @depth, 'second'
    if base?
      if base.value?
        @children.push new BottomNode base, @, @depth, 'base'
      else
        @children.push new Node base, @, @depth, 'base'
    if name?
      @children.push new BottomNode name, @, @depth, 'name'
    if parent?
      @parentNode.children.push new Node parent, @, @depth, 'parent'
    if body?
      @children.push new Node body, @, @depth + 1, 'body'

  find: (range) ->
    for child, i in @children
      nodes = child.find range
      if nodes?.length isnt 0
        return _.compact _.flatten nodes
    []

  bottomUp: (targetNode) ->
    if @isRoot
      return @topDown targetNode
    if @hasScope
      for param, i in @params
        if param.hasSameValue targetNode
          return @topDown targetNode
    @parentNode.bottomUp targetNode

  topDown: (targetNode) ->
    for child in @children
      child.topDown targetNode

  getIndent: ->
    indent = ''
    depth = @depth
    while depth--
      indent += '.'
    indent

  hasSameValue: (node) ->
    for child in @children
      return true if child.value is node.value
    false

class BottomNode extends Node

  constructor: ({ locationData, @value }, @parentNode, @depth, @type) ->
    @range = Range.createWithLocationData locationData
    if Refactor.verbose
      console.log "#{pad @range.toString(), 15}|#{pad @parentNode.type, 10}|#{@getIndent()}#{@value}"

  find: (range) ->
    return @bottomUp @ if range.equals @range

  topDown: (targetNode) ->
    return @ if targetNode isnt @ and targetNode.value is @value


exports.Range = class Range

  @createWithLocationData: ({ first_line, first_column, last_line, last_column }) ->
    new Range new Point(first_line, first_column), new Point(last_line, last_column + 1)

  @createWithAtomRange: ({ start, end }) ->
    new Range new Point(start.row, start.column), new Point(end.row, end.column)

  @createWithNumbers: (startRow, startColumn, endRow, endColumn) ->
    new Range new Point(startRow, startColumn), new Point(endRow, endColumn)

  constructor: (@start, @end) ->

  equals: ({ start, end }) ->
    start.equals(@start) and end.equals(@end)

  toString: ->
    "#{@start.toString()}-#{@end.toString()}"

class Point

  constructor: (@row, @column) ->

  equals: ({ row, column }) ->
    row is @row and column is @column

  toString: ->
    "[#{@row}:#{@column}]"
