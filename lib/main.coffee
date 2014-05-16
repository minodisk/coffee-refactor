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
    @watchers = []
    atom.workspaceView.eachEditorView @onCreated
    atom.workspaceView.command 'coffee-refactor:rename', @onRename
    atom.workspaceView.command 'coffee-refactor:done', @onDone

  deactivate: ->
    atom.workspaceView.off 'coffee-refactor:rename', @onRename
    atom.workspaceView.off 'coffee-refactor:done', @onDone
    for watcher in @watchers
      watcher.destruct()
    delete @watchers

  serialize: ->


  ###
  Events
  ###

  onCreated: (editorView) =>
    watcher = new Watcher editorView
    watcher.on 'destroyed', @onDestroyed
    @watchers.push watcher

  onDestroyed: (watcher) =>
    watcher.destruct()
    @watchers.splice @watchers.indexOf(watcher), 1

  onRename: (e) =>
    isExecuted = false
    for watcher in @watchers
      isExecuted or= watcher.rename()
    return if isExecuted
    e.abortKeyBinding()

  onDone: (e) =>
    isExecuted = false
    for watcher in @watchers
      isExecuted or= watcher.done()
    return if isExecuted
    e.abortKeyBinding()
