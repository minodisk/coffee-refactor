RefactoringView = require './RefactoringView'


module.exports =

  activate: (state) ->
    @isHighlight = false

    @views = []
    atom.workspaceView.eachEditorView (editorView) =>
      view = new RefactoringView editorView
      view.highlight @isHighlight
      @views.push view

    atom.workspaceView.command 'coffee-refactor:toggle-highlight', (e) =>
      @isHighlight = !@isHighlight
      @callViews e, 'highlight', @isHighlight
    atom.workspaceView.command 'coffee-refactor:rename', (e) =>
      @callActiveViews e, 'rename'
    atom.workspaceView.command 'coffee-refactor:done', (e) =>
      @callActiveViews e, 'done'

  deactivate: ->
    for view in @views
      view.destruct()

  serialize: ->
    console.log 'serialize'


  callViews: (e, methodName, args...) ->
    # isCalled = false
    for view, i in @views
      view[methodName].apply view, args

    # unless isCalled
    #   e.abortKeyBinding()

  callActiveViews: (e, methodName, args...) ->
    activePaneItem = atom.workspaceView.getActivePaneItem()
    isCalled = false
    for view in @views
      if view.isSameEditor activePaneItem
        isCalled or= view[methodName].apply view, args

    unless isCalled
      e.abortKeyBinding()
