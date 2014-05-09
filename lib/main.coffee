RefactoringView = require './RefactoringView'

module.exports =
new class Main

  configDefaults:
    highlightError    : true
    highlightReference: true

  activate: (state) ->
    @refactoringViews = []
    atom.workspaceView.eachEditorView @onEditorViewCreated
    atom.workspaceView.command 'coffee-refactor:rename', (e) =>
      @callActiveViews e, 'rename'
    atom.workspaceView.command 'coffee-refactor:done', (e) =>
      @callActiveViews e, 'done'

  deactivate: ->
    for view in @refactoringViews
      view.destruct()

  serialize: ->
    # console.log 'serialize'


  # callViews: (e, methodName, args...) ->
  #   for view, i in @refactoringViews
  #     view[methodName].apply view, args

  callActiveViews: (e, methodName, args...) ->
    activePaneItem = atom.workspaceView.getActivePaneItem()
    isCalled = false
    for view in @refactoringViews
      if view.isSameEditor activePaneItem
        isCalled or= view[methodName].apply view, args

    unless isCalled
      e.abortKeyBinding()


  onEditorViewCreated: (editorView) =>
    refactoringView = new RefactoringView editorView
    onEditorDestroyed = =>
      editor.off 'destroyed', onEditorDestroyed
      @onEditorViewDestroyed refactoringView

    editor = editorView.getEditor()
    editor.on 'destroyed', onEditorDestroyed

    @refactoringViews.push refactoringView

  onEditorViewDestroyed: (refactoringView) ->
    refactoringView.destruct()
    index = @refactoringViews.indexOf refactoringView
    return if index is -1
    @refactoringViews.splice index, 1
