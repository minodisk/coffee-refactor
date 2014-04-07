# CoffeeRefactorView = require './coffee-refactor-view'
{ Refactor } = require './Refactor'

module.exports =
  coffeeRefactorView: null

  activate: (state) ->
    # @coffeeRefactorView = new CoffeeRefactorView state.coffeeRefactorViewState
    atom.workspaceView.command "coffee-refactor:rename", => @rename()

  deactivate: ->
    # @coffeeRefactorView.destroy()

  serialize: ->
    # coffeeRefactorViewState: @coffeeRefactorView.serialize()

  rename: ->
    editor = atom.workspace.getActiveEditor()
    editor.selectWord()
    selection = editor.getSelection 0

    @refresh editor.getText()
    nodes = @refactor.find selection.initialScreenRange
    console.log nodes
    for { range }, i in nodes
      console.log i, range
      editor.addSelectionForBufferRange range

  refresh: (code) ->
    if code isnt @code
      @code = code
      @refactor = new Refactor code
