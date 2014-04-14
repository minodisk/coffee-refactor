CoffeeEditor = require './CoffeeEditor'

module.exports =
new class CoffeeRefactor

  activate: (state) ->
    @coffeeEditors = []
    atom.workspace.eachEditor (editor) =>
      @coffeeEditors.push new CoffeeEditor editor

    atom.workspaceView.command 'coffee-refactor:rename', @rename
    atom.workspaceView.command 'coffee-refactor:cancel', @cancel
    atom.workspaceView.command 'coffee-refactor:done', @done
    # atom.workspaceView.command 'cursor:moved', @hilight

  deactivate: ->
    for coffeeEditor in @coffeeEditors
      coffeeEditor.destruct()

  serialize: ->
    console.log 'serialize'


  # hilight: (editor) =>
  #   console.log 'highlight'


  rename: (e) =>
    @callActiveCoffeeEditor 'rename', e

  cancel: (e) =>
    @callActiveCoffeeEditor 'cancel', e

  done: (e) =>
    @callActiveCoffeeEditor 'done', e

  callActiveCoffeeEditor: (methodName, e) ->
    activePaneItem = atom.workspaceView.getActivePaneItem()
    isCalled = false
    for controller in @coffeeEditors
      if controller.isSameEditor activePaneItem
        isCalled or= controller[methodName]()
    unless isCalled
      e.abortKeyBinding()
