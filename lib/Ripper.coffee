{ nodes } = require 'coffee-script'
{ Value, Code, Literal, For, Assign } = require '../node_modules/coffee-script/lib/coffee-script/nodes'
{ Range } = require 'atom'
{ inspect } = require 'util'
{ isString, uniq, some } = require 'lodash'


LEVEL_TOP = 1
HEXNUM = /^[+-]?0x[\da-f]+/i
Value::isHexNumber = -> @bareLiteral(Literal) and HEXNUM.test @base.value


module.exports =
class Ripper

  @find: ({ symbol, references }, targetLocationData) ->
    target = @findSymbol symbol, targetLocationData
    return [] unless target?
    @findReference(references, target).data

  @findSymbol: (parent, targetLocationData) ->
    target = null

    parent.eachChild (child) =>
      # Skip if target is found
      return false if target?
      # Skip no locationData
      return true unless child.locationData?
      # Skip primitive node
      return true if @isPrimitive child
      # Skip object key access
      return true if @isKeyOfObjectAccess parent, child
      # Skip key in object literal
      return true if @isKeyOfObjectLiteral parent, child

      if child instanceof For
        if @isContainsLocationData child.name, targetLocationData
          target = child.name
          return false
        else if @isContainsLocationData child.index, targetLocationData
          target = child.index
          return false
      else if child instanceof Literal
        if @isContainsLocationData child, targetLocationData
          target = child
          return false

      target = @findSymbol child, targetLocationData
      return false if target?

    target

  @findReference: (parent, target, isDeclaredInParent) ->
    isDeclaredInParent ?= @isDeclared target, parent
    isFixed = false
    data = []

    parent.eachChild (child) =>
      return false if isFixed

      if child instanceof Code
        isDeclared = @isDeclared target, child, parent
        childRef = @findReference child, target, isDeclaredInParent or isDeclared

        if @hasTarget childRef.data, target
          if childRef.isFixed or isDeclared
            data = childRef.data
            isFixed = true
            return false
          data = data.concat childRef.data
          return true
        if isDeclared
          return true
        if isDeclaredInParent
          data = data.concat childRef.data
          return true
        return true

      # Inherit parent scope
      child.scope = parent.scope

      # Skip key access of object
      return true if @isKeyOfObjectAccess parent, child
      # Skip key of object literal
      return true if @isKeyOfObjectLiteral parent, child

      if @isSameLiteral child, target
        data.push child
        return true

      if child instanceof For
        if @isSameLiteral child.name, target
          data.push child.name
        else if @isSameLiteral child.index, target
          data.push child.index

      childRef = @findReference child, target, isDeclaredInParent
      if childRef.isFixed
        data = childRef.data
        isFixed = true
        return false
      data = data.concat childRef.data
      return true

    data = uniq data
    { isFixed, data }

  @locationDataToRange: ({ first_line, first_column, last_line, last_column }) ->
    new Range [ first_line, first_column ], [ last_line, last_column + 1 ]

  @rangeToLocationData: ({ start, end }) ->
    first_line  : start.row
    first_column: start.column
    last_line   : end.row
    last_column : end.column - 1

  @isContainsLocationData: (node, locationData) ->
    return false unless node? and node.locationData?
    nodeLocationData = node.locationData
    (
      nodeLocationData.first_line < locationData.first_line  or
      nodeLocationData.first_line is locationData.first_line and
      nodeLocationData.first_column <= locationData.first_column
    ) and
    (
      locationData.last_line < nodeLocationData.last_line or
      locationData.last_line is nodeLocationData.last_line and
      locationData.last_column <= nodeLocationData.last_column
    )

  @declaredSymbols: (scope) ->
    name for { type, name } in scope.variables when @isScopedSymbol type, name

  @isScopedSymbol: (type, name) ->
    (
      type is 'var'   or
      type is 'param'
    )                       and
    isString(name)        and
    name.charAt(0) isnt '_'

  @isPrimitive: (node) ->
    node.isString?()       or
    node.isSimpleNumber?() or
    node.isHexNumber?()    or
    node.isRegex?()

  @isKeyOfObjectAccess: (parent, child) ->
    parent.soak is false          and
    child.asKey                   and
    child.unfoldedSoak isnt false

  @isKeyOfObjectLiteral: (parent, child) ->
    parent.context is 'object' and
    child is parent.variable   and
    parent instanceof Assign   and
    child instanceof Value

  @isDeclared: (target, child, parent) ->
    try
      unless child.scope?
        o = indent: ''
        unless parent?
          child.compileRoot o
        else
          o.scope = parent.scope
          child.compileNode o
        child.scope = o.scope
      symbols = @declaredSymbols child.scope
      return symbols.indexOf(target.value) isnt -1
    catch err
    false

  @hasTarget: (refs, target) ->
    some refs, (ref) =>
      @isEqualLocationData(ref.locationData, target.locationData) and
      @isSameLiteral(ref, target)

  @isEqualLocationData: (a, b) ->
    return false unless a? and b?
    a.first_line   is b.first_line   and \
    a.first_column is b.first_column and \
    a.last_line    is b.last_line    and \
    a.last_column  is b.last_column

  @isSameLiteral: (a, b) ->
    a?                                  and
    b?                                  and
    a.locationData? and b.locationData? and
    a instanceof Literal                and
    b instanceof Literal                and
    a.value is b.value


  nodes: null

  destruct: ->
    delete @nodes

  parse: (code) ->
    try
      @nodes =
        symbol    : nodes code
        references: nodes code
    catch err
      delete @nodes

  find: (range) ->
    return [] unless @nodes?

    targetLocationData = Ripper.rangeToLocationData range
    foundNodes = Ripper.find @nodes, targetLocationData
    for { locationData }, i in foundNodes
      Ripper.locationDataToRange locationData
