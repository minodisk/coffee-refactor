Parser = require './Parser'

module.exports = new class CoffeeRefactor

  activate: (state) ->
    atom.workspaceView.command 'coffee-refactor:rename', @rename
    atom.workspaceView.command 'coffee-refactor:done', @done
    atom.workspace.eachEditor @onEditorCreated

  deactivate: ->
    console.log 'deactivate'

  serialize: ->
    console.log 'serialize'

  onEditorCreated: (editor) =>
    editor.parser = new Parser
    editor.on 'contents-modified', =>
      @modified editor
    @modified editor

  modified: (editor) =>
    editor.parser.parse editor.buffer.cachedText

  rename: (e) =>
    editor = atom.workspace.getActiveEditor()
    return e.abortKeyBinding() unless editor?

    editor.selectWord()
    selection = editor.getSelection 0
    code = editor.getText()
    nodes = editor.parser.find selection.getBufferRange()
    return e.abortKeyBinding() if nodes.length is 0

    @target =
      editor: editor
      selection: selection

    for { locationData } in nodes
      range = Parser.locationDataToRange locationData
      editor.addSelectionForBufferRange Parser.locationDataToRange locationData

  done: (e) =>
    return e.abortKeyBinding() unless @target?

    @target.editor.setCursorBufferPosition @target.selection.getBufferRange().start

    delete @target
