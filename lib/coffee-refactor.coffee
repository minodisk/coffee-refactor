CoffeeRefactorView = require './coffee-refactor-view'

module.exports =
  coffeeRefactorView: null

  activate: (state) ->
    @coffeeRefactorView = new CoffeeRefactorView state.coffeeRefactorViewState
    atom.workspaceView.command "coffee-refactor:toggle", => @refact()

  deactivate: ->
    @coffeeRefactorView.destroy()

  serialize: ->
    coffeeRefactorViewState: @coffeeRefactorView.serialize()

  refact: ->
    editor = atom.workspace.getActiveEditor()
    editor.selectWord()
    text = editor.getText()
    word = editor.getSelectedText()
    console.log word, text
