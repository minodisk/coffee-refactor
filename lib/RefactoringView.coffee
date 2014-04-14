{ View } = require 'atom'
Refactoring = require './Refactoring'

module.exports =
class RefactoringingView extends View

  @content: ->
    @div class: 'coffee-refactor'

  constructor: (@editorView) ->
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
    console.log 'onCursorMoved'
    @highlight @refactoring.getReferenceRanges()


  highlight: (ranges) ->
    console.log 'highlight:', ranges
