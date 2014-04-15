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
    @refactoring.on 'parsed', @updateHighlight

    @editorView.underlayer.append @
    @editorView.on 'cursor:moved', @updateHighlight

  destruct: =>
    @remove()

    @refactoring.destruct()

    @editorView.off 'cursor:moved', @updateHighlight

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


  highlight: (@isHighlight) ->
    @updateHighlight()
    true

  updateHighlight: =>
    @empty()
    if @isHighlight
      @highlightAt @refactoring.getReferenceRanges()

  highlightAt: (ranges) ->
    for range in ranges
      markerView = new MarkerView @editorView, @refactoring, range
      @append markerView
