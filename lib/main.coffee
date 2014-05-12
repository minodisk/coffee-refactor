RefactoringView = require './RefactoringView'

module.exports =
new class Main

  configDefaults:
    highlightError    : true
    highlightReference: true


  ###
  package life cycle
  ###

  activate: (state) ->
    @refactoringViews = []
    atom.workspaceView.eachEditorView @onEditorViewCreated

  deactivate: ->
    for view in @refactoringViews
      view.destruct()

  serialize: ->


  onEditorViewCreated: (editorView) =>
    new RefactoringView editorView
