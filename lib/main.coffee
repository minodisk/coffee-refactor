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
      watcher.off 'destroyed', @onDestroyed
      watcher.destruct()
    delete @watchers

  serialize: ->


  ###
  Events
  ###

  onCreated: (editorView) =>
    watcher = new Watcher editorView
    watcher.off 'destroyed', @onDestroyed
    @watchers.push watcher

  onDestroyed: (watcher) =>
    watcher.off 'destroyed', @onDestroyed
    @watchers.splice @watchers.indexOf(watcher), 1

  onRename: (e) =>
    isExecuted = false
    for watcher in @watchers when watcher.isActive()
      isExecute or= watcher.onRename()
    return if isExecuted
    e.abortKeyBinding()

  onDone: (e) =>
    for watcher in @watchers when watcher.isActive()
      isExecute or= watcher.onDone()
    return if isExecuted
    e.abortKeyBinding()
