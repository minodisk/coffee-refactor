{ View } = require 'atom'
Refactor = require './Refactor'

module.exports =
class RefactorView extends View

  @content: ->
    @div class: 'coffee-refactor'

  constructor: (@editorView) ->
    @model = new Refactor @editorView.getEditor()
    @editorView.underlayer.append @
    @editorView.on 'cursor:moved', @onCursorMoved

  isSameEditor: (editor) ->
    @model.isSameEditor editor

  rename: ->
    @model.rename()

  cancel: ->
    @model.cancel()

  done: ->
    @model.done()

  onCursorMoved: ->
