{ nodes } = require 'coffee-script'
{ Value, Code, Block, Literal, For, Obj, Arr, Assign } = require '../node_modules/coffee-script/lib/coffee-script/nodes'
{ Range } = require 'atom'
{ inspect } = require 'util'


HEXNUM = /^[+-]?0x[\da-f]+/i
Value::isHexNumber = -> @bareLiteral(Literal) and HEXNUM.test @base.value


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

  @isContainsLocationData: (a, b) ->
    (
      a.first_line < b.first_line or \
      a.first_line is b.first_line and a.first_column <= b.first_column
    ) and \
    (
      b.last_line < a.last_line or \
      b.last_line is a.last_line and b.last_column <= a.last_column
    )

  @findReferences: (node, targetLocationData) ->
    target = @findSymbol node, targetLocationData
    return [] unless target?
    @traverseCode(node, target)[0]

  @findSymbol: (parent, targetLocationData) ->
    target = null

    parent.eachChild (child) ->
      # Skip if target is found
      return false if target?

      # Skip primitive node
      return true if child.isString?() or \
                     child.isSimpleNumber?() or \
                     child.isHexNumber?() or \
                     child.isRegex?()

      # Skip object key access
      if child.asKey
        return true

      # Skip key in object literal
      if child instanceof Value and \
         parent.context is 'object' and \
         parent instanceof Assign and \
         child is parent.variable
        return true

      if child instanceof For
        if child.name? and \
           Parser.isContainsLocationData child.name.locationData, targetLocationData
          target = child.name
          return false
        if child.index? and \
           Parser.isContainsLocationData child.index.locationData, targetLocationData
          target = child.index
          return false
      if child instanceof Literal
        if Parser.isContainsLocationData child.locationData, targetLocationData
          target = child
          return false

      target = Parser.findSymbol child, targetLocationData
      return false if target?

    target

  @traverseCode: (parent, target, dests = []) ->
    isFixed = false

    parent.eachChild (child) ->

      if child instanceof Code
        isContains = Parser.isContains child, target
        isDeclared = Parser.isDeclared child, target
        if isContains
          [ childDests, isChildFixed ] = Parser.traverseCode child, target, null
          if isDeclared or isChildFixed
            dests = childDests
            isFixed = true
            return false
          else
            dests.concat childDests
        else if isDeclared
          return true



      # Skip object key access
      if child.asKey
        return true

      # Skip key in object literal
      if child instanceof Value and \
         parent.context is 'object' and \
         parent instanceof Assign and \
         child is parent.variable
        return true

      if child instanceof For
        if Parser.isSameLiteral child.name, target
          dests.push child.name
        if Parser.isSameLiteral child.index, target
          dests.push child.index
      if Parser.isSameLiteral child, target
        dests.push child

      [ childDests, isChildFixed ] = Parser.traverseCode child, target, dests
      if isChildFixed
        dests = childDests
        isFixed = true
        return false
      else
        dests.concat nodes

    [ dests, isFixed ]

  @hasChild: (parent, child) ->
    for key, val of parent when parent.hasOwnProperty key
      return true if child is val
    false

  ###
  Check the target `Literal` is declared in the `Code`
  @param {Code} code A `Code`
  @param {Literal} target A `Literal`
  @returns {Boolean} Has declarations in the `Code`
  ###
  @isDeclared: (code, target) ->
    # 1. clone Code instance
    # 2. compile Code
    # 3. check declared variable in lexical scope of the block
    code = new Code code.params, new Block(code.body), code.tag
    try
      code.compileNode code
      return true for variable in code.scope.variables when variable.name is target.value
    catch err
    false

  ###
  Check the target `Node` exsits in the `Node`.
  @param {Node} node A `Node`
  @param {Node} target The finding target `Node`.
  @returns {Boolean} Exists.
  ###
  @isContains: (node, target) ->
    isContains = false
    node.traverseChildren true, (child) ->
      isContains or= child is target
      !isContains
    isContains

  ###
  Check `Literal`s has same value
  @param {Literal} a A `Literal`
  @param {Literal} b Another `Literal`
  @returns {Boolean} Has same value
  ###
  @isSameLiteral: (a, b) ->
    a instanceof Literal and \
    b instanceof Literal and \
    a.value is b.value


  nodes: null

  destruct: ->
    delete @nodes

  parse: (code) ->
    try
      @nodes = nodes code
    catch err
      @nodes = null

  find: (range) ->
    return [] unless @nodes?

    targetLocationData = Parser.rangeToLocationData range
    for { locationData }, i in Parser.findReferences @nodes, targetLocationData
      Parser.locationDataToRange locationData
