Watcher = require './Watcher'

module.exports =
new class Main

  configDefaults:
    highlightError    : true
    highlightReference: true


  ###
  Life cycle
  ###

  activate: (state) ->
    @refactoringViews = []
    atom.workspaceView.eachEditorView @onEditorViewCreated

  deactivate: ->
    for view in @refactoringViews
      view.destruct()

  serialize: ->


  ###
  Events
  ###

  onEditorViewCreated: (editorView) =>
    new Watcher editorView
