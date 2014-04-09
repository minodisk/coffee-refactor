# CoffeeRefactorView = require './coffee-refactor-view'
Refactor = require './Refactor'
{ Point } = require 'atom'
module.exports = new class CoffeeRefactor

  # coffeeRefactorView: null

  activate: (state) ->
    console.log 'activate'
    # @coffeeRefactorView = new CoffeeRefactorView state.coffeeRefactorViewState
    atom.workspaceView.command "coffee-refactor:rename", @rename
    atom.workspaceView.command "coffee-refactor:done", @done

  deactivate: ->
    # @coffeeRefactorView.destroy()

  serialize: ->
    # coffeeRefactorViewState: @coffeeRefactorView.serialize()

  rename: =>
    console.log 'try rename'

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

    console.log 'rename'

    @target =
      editor: editor
      selection: selection
    for { range } in nodes
      editor.addSelectionForBufferRange range

  done: (e) =>
    console.log 'done'

    return e.abortKeyBinding() unless @target?

    @target.editor.setCursorBufferPosition @target.selection.getBufferRange().start

    delete @target
