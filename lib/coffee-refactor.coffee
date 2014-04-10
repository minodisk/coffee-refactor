# CoffeeRefactorView = require './coffee-refactor-view'
Refactor = require './Refactor'

module.exports = new class CoffeeRefactor

  # coffeeRefactorView: null

  activate: (state) ->
    # @coffeeRefactorView = new CoffeeRefactorView state.coffeeRefactorViewState
    atom.workspaceView.command "coffee-refactor:rename", @rename
    atom.workspaceView.command "coffee-refactor:done", @done

  deactivate: ->
    # @coffeeRefactorView.destroy()

  serialize: ->
    # coffeeRefactorViewState: @coffeeRefactorView.serialize()

  rename: =>
    editor = atom.workspace.getActiveEditor()
    return unless editor?

    editor.selectWord()
    selection = editor.getSelection 0

    code = editor.getText()
    if code isnt @code
      @code = code
      @refactor = new Refactor code

    nodes = @refactor.find selection.getBufferRange()
    return if nodes.length is 0

    @target =
      editor: editor
      selection: selection

    for { locationData } in nodes
      range = Refactor.locationDataToRange locationData
      editor.addSelectionForBufferRange Refactor.locationDataToRange locationData

  done: (e) =>
    return e.abortKeyBinding() unless @target?

    @target.editor.setCursorBufferPosition @target.selection.getBufferRange().start

    delete @target
