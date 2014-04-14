module.exports =
class CoffeeRefactorView extends View

  @content: ->
    @div class: 'coffee-refactor'


  constructor: (@editorView) ->
    @model = new CoffeeRefactor @editorView.getEditor()
    @editorView.underlayer.append @
    @editorView.on 'cursor:moved', @onCursorMoved

  rename: ->

  cancel: ->

  done: ->

  onCursorMoved: ->
