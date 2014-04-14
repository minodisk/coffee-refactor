{ tokens, nodes } = require 'coffee-script'
{ Code, Block, Param, Literal } = require '../node_modules/coffee-script/lib/coffee-script/nodes'
{ Scope } = require '../node_modules/coffee-script/lib/coffee-script/scope'
{ Range } = require 'atom'

# _ = require 'underscore'
{ inspect } = require 'util'


pad = (str, len, pad = ' ') ->
  while str.length < len
    str += pad
  str

padL = (str, len, pad = ' ') ->
  while str.length < len
    str = pad + str
  str


module.exports = class CoffeeParser

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

  @findDeclaredNodes: (node, targetLocationData) ->
    target = @searchAtLocationData node, targetLocationData
    return [] unless target?

    @traverseScope node, target

  @searchAtLocationData: (node, targetLocationData) ->
    target = null
    node.traverseChildren true, (child) ->
      # return false if node.classBody
      if child instanceof Literal
        unless child.locationData?
          console.log child
        if CoffeeParser.isEqualLocationData child.locationData, targetLocationData
          target = child
          return false
    target

  @traverseScope: (node, target) ->
    dests = []

    isBreak = false
    node.traverseChildren true, (child) ->
      return false if isBreak

      unless child instanceof Code
        if CoffeeParser.isSameLiteral child, target
          dests.push child
        return true

      if CoffeeParser.hasDeclarations child, target
        if CoffeeParser.isContains child, target
          dests = CoffeeParser.findSameLiterals child, target
          isBreak = true
        return false
      else
        return true

    dests

  @findSameLiterals: (node, target) ->
    dests = []
    node.traverseChildren true, (child) ->
      if CoffeeParser.isSameLiteral child, target
        dests.push child
    dests

  @hasDeclarations: (code, target) ->
    code = new Code code.params, new Block(code.body), code.tag
    code.compileNode code
    return true for variable in code.scope.variables when variable.name is target.value
    false

  @isContains: (node, target) ->
    isContains = false
    node.traverseChildren true, (child) ->
      isContains or= child is target
      !isContains
    isContains

  @isSameLiteral: (a, b) ->
    a instanceof Literal and \
    b instanceof Literal and \
    a isnt b and \
    a.value is b.value


  nodes: null


  constructor: ->

  parse: (code) ->
    try
      @nodes = nodes code
    catch err
      @nodes = null

  find: (range) ->
    return [] unless @nodes?

    targetLocationData = CoffeeParser.rangeToLocationData range
    CoffeeParser.findDeclaredNodes @nodes, targetLocationData
