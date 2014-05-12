{ View } = require 'atom'
Refactoring = require './Refactoring'
ReferenceView = require './background/ReferenceView'
ErrorView = require './background/ErrorView'
GutterView = require './gutter/GutterView'
{ locationDataToRange } = require './utils/LocationDataUtil'

module.exports =
class RefactoringingView extends View

  @content: ->
    @div class: 'coffee-refactor'

  constructor: (@editorView) ->
    super()

    # Setup model
    @refactoring = new Refactoring @editorView.getEditor()
    @refactoring.on 'destroyed', @destruct
    @refactoring.on 'parse:error', @onParseError
    @refactoring.on 'parse:success', @onParseSuccess
    @refactoring.on 'parse:start', @onParseStart
    @refactoring.on 'parse:end', @onParseEnd

    # Setup myself
    @editorView.underlayer.append @
    @editorView.on 'cursor:moved', @onCursorMoved

    # Setup child view
    @referenceView = new ReferenceView @editorView, @refactoring
    @append @referenceView
    @errorView = new ErrorView @editorView, @refactoring
    @append @errorView

    # Setup gutter view
    @gutterView = new GutterView @editorView.gutter

    # Listen commands
    atom.workspaceView.command 'coffee-refactor:rename', @onRename
    atom.workspaceView.command 'coffee-refactor:done', @onDone

  destruct: =>
    @remove()

    @refactoring.destruct()

    @editorView.off 'cursor:moved', @onCursorMoved

    delete @refactoring
    delete @editorView


  isSameEditor: (editor) ->
    @refactoring.isSameEditor editor


  onRename: (e) =>
    unless @refactoring.rename()
      e.abortKeyBinding()

  onDone: (e) =>
    unless @refactoring.done()
      e.abortKeyBinding()

  onCursorMoved: =>
    @refactoring.cancel()
    unless @refactoring.isParsing
      clearTimeout @timeoutId
      @timeoutId = setTimeout @updateReferences, 0


  setEnabled: (isEnabled) ->
    @referenceView.setEnabled isEnabled
    @errorView.setEnabled isEnabled
    if isEnabled
      @updateReferences()

  onParseError: ({ location, message }) =>
    return unless location?
    range = locationDataToRange location
    err =
      range  : range
      message: message
    @errorView.update [ range ]
    @gutterView.update [ err ]

  onParseSuccess: =>
    @errorView.update()
    @gutterView.update()

  onParseStart: =>
    @editorView.off 'cursor:moved', @onCursorMoved
    @referenceView.empty()

  onParseEnd: =>
    @editorView.off 'cursor:moved', @onCursorMoved
    @editorView.on 'cursor:moved', @onCursorMoved
    @updateReferences()

  updateReferences: =>
    @referenceView.update @refactoring.getReferenceRanges()
