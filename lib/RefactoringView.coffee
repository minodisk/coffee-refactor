{ View } = require 'atom'
Refactoring = require './Refactoring'
MarkerView = require './MarkerView'

module.exports =
class RefactoringingView extends View

  @content: ->
    @div class: 'coffee-refactor'

  constructor: (@editorView) ->
    super()

    @isHighlight = false

    @refactoring = new Refactoring @editorView.getEditor()
    @refactoring.on 'parse:start', @onParseStart
    @refactoring.on 'parse:end', @onParseEnd

    @editorView.underlayer.append @
    @editorView.on 'cursor:moved', @onCursorMoved

  destruct: =>
    @remove()

    @refactoring.destruct()

    @editorView.off 'cursor:moved', @onCursorMoved

    delete @isHighlight
    delete @refactoring
    delete @editorView


  isSameEditor: (editor) ->
    @refactoring.isSameEditor editor

  rename: ->
    @refactoring.rename()

  cancel: ->
    @refactoring.cancel()

  done: ->
    @refactoring.done()


  setHighlight: (@isHighlight) ->
    @highlight()
    true

  onParseStart: =>
    @editorView.off 'cursor:moved', @onCursorMoved
    @empty()

  onParseEnd: =>
    @editorView.off 'cursor:moved', @onCursorMoved
    @editorView.on 'cursor:moved', @onCursorMoved
    @highlight()

  onCursorMoved: =>
    unless @refactoring.isParsing
      clearTimeout @timeoutId
      @timeoutId = setTimeout @highlight, 0

  highlight: =>
    @empty()
    if @isHighlight
      @highlightAt @refactoring.getReferenceRanges()

  highlightAt: (ranges) ->
    for range in ranges
      markerView = new MarkerView @editorView, @refactoring, range
      @append markerView
