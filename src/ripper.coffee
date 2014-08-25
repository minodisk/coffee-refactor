{ nodes } = require '../vendor/coffee-script/lib/coffee-script/coffee-script'
{ Lexer } = require '../vendor/coffee-script/lib/coffee-script/lexer'
{ parse } = require '../vendor/coffee-script/lib/coffee-script/parser'
{ updateSyntaxError } = require '../vendor/coffee-script/lib/coffee-script/helpers'
{ Value, Code, Literal, For, Assign, Access, Parens } = require '../vendor/coffee-script/lib/coffee-script/nodes'
{ flatten } = require '../vendor/coffee-script/lib/coffee-script/helpers'
# Range = require '../vendor/text-buffer/src/range'
# { isString, uniq, some } = _ = require 'lodash'
{ locationDataToRange, isEqualsLocationData, isContains } = require './location_data_util'
# { config } = atom

LEVEL_TOP = 1
HEXNUM = /^[+-]?0x[\da-f]+/i
Value::isHexNumber = -> @bareLiteral(Literal) and HEXNUM.test @base.value
bench = do ->
  prev = 0
  ->
    current = new Date().getTime()
    past = current - prev
    prev = current
    "#{past}ms"
isString = (obj) ->
  obj.toString.call(obj) is "[object String]"
uniq = (arr) ->
  newArr = []
  for elem in arr
    unless elem in newArr
      newArr.push elem
  newArr
some = (arr, predicate) ->
  for elem in arr
    if predicate elem
      return elem
  null
each = (arr, iterator) ->
  for elem in arr
    returns = iterator elem
    if returns is false
      break

module.exports =
class Ripper
  @find: (tokens, nodes, point) ->
    return [] unless @isIdentifier tokens, point
    target = @findSymbol nodes, point
    return [] unless target?
    @findReference(nodes, target).data

  @isIdentifier: (tokens, point) ->
    for token in tokens
      if token[0] is 'IDENTIFIER' and isContains token[2], point
        return true
    false

  @findSymbol: (nodes, point) ->
    target = null

    each nodes._children, (child) =>
      # Break this loop if target is found
      return false if target?
      # Skip no locationData
      return true unless child.locationData?
      # Skip primitive node
      return true if @isPrimitive child
      # Skip object key access
      return true if @isKeyOfObjectAccess nodes, child
      # Skip key in object literal
      return true if @isKeyOfObjectLiteral nodes, child

      if child instanceof Literal
        if isContains child.locationData, point
          target = child
          return false

      target = @findSymbol child, point
      return false if target?

    target

  @findReference: (parent, target, isDeclaredInParent) ->
    isDeclaredInParent ?= @isDeclared target, parent
    isFixed = false
    data = []

    each parent._children, (child) =>
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
      isEqualsLocationData(ref.locationData, target.locationData) and
      @isSameLiteral(ref, target)

  @declaredSymbols: (scope) ->
    name for { type, name } in scope.variables when @isScopedSymbol type, name

  @isScopedSymbol: (type, name) ->
    (type is 'var' or type is 'param') and
    isString(name)                     and
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

  @isSameLiteral: (a, b) ->
    a?                                  and
    b?                                  and
    a.locationData? and b.locationData? and
    a instanceof Literal                and
    b instanceof Literal                and
    a.value is b.value

  @generateNodes: (parent) ->
    return unless parent.children?
    children = []

    # Add `for` statement
    if parent.index?
      children.push parent.index
    if parent.name?
      children.push parent.name

    for attr in parent.children when parent[attr]
      children.push parent[attr]
    children = flatten children
    for child in children
      @generateNodes child
    parent._children = children
    parent

  constructor: ->
    @lexer = new Lexer

  destruct: ->
    delete @lexer
    delete @tokens
    delete @nodes

  parse: (code) ->
    # if config.getSettings()['coffee-refactor']? and code.length > config.getSettings()['coffee-refactor']['disable in large files (chars)']
    #   console.warn 'coffe-refactor is disabled in large file: You can cange the threshold in preference pane.'
    #   return

    try
      @tokens = @lexer.tokenize code, {}
      @nodes = Ripper.generateNodes parse @tokens
      return
    catch err
      updateSyntaxError err, code
      { location, message } = err
      if location? and message?
        return error:
          range  : locationDataToRange location
          message: message
      else
        # Logs uncaught parse error.
        console.warn err
        return

  find: (point) ->
    return [] unless @nodes?
    # bench()
    foundNodes = Ripper.find @tokens, @nodes, point
    results = for { locationData }, i in foundNodes
      locationDataToRange locationData
    # console.log 'find:', bench()
    results

ripper = new Ripper
self.addEventListener 'message', ({ data: { timestamp, method, args, callback } }) ->
  self.postMessage { timestamp, callback, returns: ripper[method].apply ripper, args }
, false
