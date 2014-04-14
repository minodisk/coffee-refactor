RefactorView = require './RefactorView'


module.exports =

  activate: (state) ->
    @views = []
    atom.workspaceView.eachEditorView (editorView) =>
      @views.push new RefactorView editorView

    atom.workspaceView.command 'coffee-refactor:rename', (e) =>
      @callActiveCoffeeEditor 'rename', e
    atom.workspaceView.command 'coffee-refactor:cancel', (e) =>
      @callActiveCoffeeEditor 'cancel', e
    atom.workspaceView.command 'coffee-refactor:done', (e) =>
      @callActiveCoffeeEditor 'done', e

  deactivate: ->
    for view in @views
      view.destruct()

  serialize: ->
    console.log 'serialize'


  callActiveCoffeeEditor: (methodName, e) ->
    activePaneItem = atom.workspaceView.getActivePaneItem()
    isCalled = false
    for view in @views
      if view.isSameEditor activePaneItem
        isCalled or= view[methodName]()

    unless isCalled
      e.abortKeyBinding()
