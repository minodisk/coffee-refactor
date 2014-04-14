Parser = require './Parser'


module.exports =
class Refactoring


  isCoffee: false


  ###
  Life Cycle
  ###

  constructor: (@editor) ->
    @parser = new Parser

    @editor.on 'destroyed', @destruct
    @editor.on 'grammar-changed', @checkGrammar

    @checkGrammar()

  destruct: =>
    @editor.off 'destroyed', @destruct
    @editor.off 'grammar-changed', @checkGrammar
    @editor.off 'contents-modified', @parse
    delete @editor
    delete @parser


  ###
  Event listeners
  ###

  checkGrammar: (e) =>
    isCoffee = @editor.getGrammar().name is 'CoffeeScript'
    return if isCoffee is @isCoffee

    @editor.off 'contents-modified', @parse
    if isCoffee
      @editor.on 'contents-modified', @parse
      @parse()


  ###
  Public methods
  ###

  isSameEditor: (editor) ->
    editor is @editor

  rename: ->
    console.log 'rename'

    @editor.selectWord()
    selection = @editor.getSelection 0
    nodes = @parser.find selection.getBufferRange()
    return false if nodes.length is 0

    @selection = selection
    for { locationData } in nodes
      range = Parser.locationDataToRange locationData
      @editor.addSelectionForBufferRange Parser.locationDataToRange locationData
    true

  done: ->
    console.log 'done'

    return false unless @selection?

    @editor.setCursorBufferPosition @selection.getBufferRange().start
    delete @selection
    true

  getReferenceRanges: ->
    

  ###
  Private methods
  ###

  parse: =>
    console.log 'parse'

    @editor.selectWord()
