Ripper = require './Ripper'
{ EventEmitter } = require 'events'


module.exports =
class Refactoring extends EventEmitter


  ###
  Life Cycle
  ###

  constructor: (@editor) ->
    super()

    @ripper = new Ripper

    @editor.on 'grammar-changed', @checkGrammar

    @checkGrammar()

  destruct: =>
    @removeAllListeners()

    @ripper.destruct()

    @editor.off 'grammar-changed', @checkGrammar
    @editor.buffer.off 'changed', @parse

    delete @editor
    delete @ripper


  ###
  Event listeners
  ###

  checkGrammar: (e) =>
    @isCoffee = @editor.getGrammar().name is 'CoffeeScript'

    @editor.buffer.off 'changed', @parse
    if @isCoffee
      @editor.buffer.on 'changed', @parse
      @parse()


  ###
  Public methods
  ###

  isSameEditor: (editor) ->
    editor is @editor

  rangeForRow: ->
    @editor.buffer.rangeForRow.apply @editor.buffer, arguments

  rename: ->
    @editor.selectWord()
    selection = @editor.getLastSelection()
    ranges = @ripper.find selection.getBufferRange()
    return false if ranges.length is 0

    @selection = selection
    for range in ranges
      @editor.addSelectionForBufferRange range
    true

  done: ->
    return false unless @selection?
    @editor.setCursorBufferPosition @selection.getBufferRange().start
    delete @selection
    true

  getReferenceRanges: ->
    @ripper.find @editor.getLastSelection().getBufferRange()

  ###
  Private methods
  ###

  parse: =>
    @ripper.parse @editor.buffer.getText()
    @emit 'parsed'
