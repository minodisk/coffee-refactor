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
    @ripper.on 'error:compile', @onErrorCompile

    @editor.on 'grammar-changed', @checkGrammar

    @checkGrammar()

  destruct: =>
    @removeAllListeners()

    @ripper.destruct()

    @editor.off 'grammar-changed', @checkGrammar
    @editor.buffer.off 'changed', @onBufferChanged

    delete @editor
    delete @ripper


  ###
  Event listeners
  ###

  checkGrammar: (e) =>
    @isCoffee = @editor.getGrammar().name is 'CoffeeScript'

    @editor.buffer.off 'changed', @onBufferChanged
    if @isCoffee
      @editor.buffer.on 'changed', @onBufferChanged
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
    cursor = @editor.cursors[0]
    return [] unless cursor?
    range = cursor.getCurrentWordBufferRange includeNonWordCharacters: false
    return [] if range.isEmpty()
    @ripper.find range

  ###
  Private methods
  ###

  onBufferChanged: =>
    clearTimeout @timeoutId
    @timeoutId = setTimeout @parse, 0
    unless @isParsing
      @isParsing = true
      @emit 'parse:start'

  parse: =>
    text = @editor.buffer.getText()
    if text isnt @cachedText
      @cachedText = text
      @ripper.parse text
    if @isParsing
      @isParsing = false
      @emit 'parse:end'

  onErrorCompile: (err) =>
    @emit 'parse:error', err
