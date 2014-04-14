{ View } = require 'atom'
Refactoring = require './Refactoring'
MarkerView = require './MarkerView'

module.exports =
class RefactoringingView extends View

  @content: ->
    @div class: 'coffee-refactor'

  constructor: (@editorView) ->
    super()
    @refactoring = new Refactoring @editorView.getEditor()
    @editorView.underlayer.append @
    @editorView.on 'cursor:moved', @onCursorMoved

  isSameEditor: (editor) ->
    @refactoring.isSameEditor editor

  rename: ->
    @refactoring.rename()

  cancel: ->
    @refactoring.cancel()

  done: ->
    @refactoring.done()


  onCursorMoved: =>
    @highlight @refactoring.getReferenceRanges()

  highlight: (ranges) ->
    console.log 'highlight:', ranges
    @empty()
    for range in ranges
      @append new MarkerView @editorView, range
