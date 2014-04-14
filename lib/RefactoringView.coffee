{ View } = require 'atom'
Refactoring = require './Refactoring'
MarkerView = require './MarkerView'

module.exports =
class RefactoringingView extends View

  @content: ->
    @div class: 'coffee-refactor'

  constructor: (@editorView) ->
    super()
    @markerViews = []
    @refactoring = new Refactoring @editorView.getEditor()
    @refactoring.on 'parse', @updateHighlight
    @editorView.underlayer.append @
    @editorView.on 'cursor:moved', @updateHighlight

  isSameEditor: (editor) ->
    @refactoring.isSameEditor editor

  rename: ->
    @refactoring.rename()

  cancel: ->
    @refactoring.cancel()

  done: ->
    @refactoring.done()


  updateHighlight: =>
    @highlight @refactoring.getReferenceRanges()

  highlight: (ranges) ->
    console.log 'highlight'
    for markerView in @markerViews
      markerView.destruct()
    @markerViews = []
    @empty()
    for range in ranges
      markerView = new MarkerView @editorView, range
      @markerViews.push markerView
      @append markerView
