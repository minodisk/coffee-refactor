{ View } = require 'atom'
Refactoring = require './Refactoring'
ReferenceView = require './ReferenceView'
ErrorView = require './ErrorView'
LocationDataUtil = require './LocationDataUtil'

module.exports =
class RefactoringingView extends View

  @content: ->
    @div class: 'coffee-refactor'

  constructor: (@editorView) ->
    super()

    # Setup model
    @refactoring = new Refactoring @editorView.getEditor()
    @refactoring.on 'parse:error', @onParseError
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

    console.log 'append complete'

  destruct: =>
    @remove()

    @refactoring.destruct()

    @editorView.off 'cursor:moved', @onCursorMoved

    delete @isHighlight
    delete @refactoring
    delete @editorView


  isSameEditor: (editor) ->
    @refactoring.isSameEditor editor

  rename: ->
    @refactoring.rename()

  cancel: ->
    @refactoring.cancel()

  done: ->
    @refactoring.done()


  setEnabled: (isEnabled) ->
    @referenceView.setEnabled isEnabled
    @errorView.setEnabled isEnabled
    if isEnabled
      @updateReferences()

  onParseError: (err) =>
    if err.location?
      @errorView.highlight [ LocationDataUtil.locationDataToRange(err.location) ], err.message

  onParseStart: =>
    @editorView.off 'cursor:moved', @onCursorMoved
    @referenceView.empty()

  onParseEnd: =>
    @editorView.off 'cursor:moved', @onCursorMoved
    @editorView.on 'cursor:moved', @onCursorMoved
    @updateReferences()

  onCursorMoved: =>
    unless @refactoring.isParsing
      clearTimeout @timeoutId
      @timeoutId = setTimeout @updateReferences, 0

  updateReferences: =>
    @referenceView.highlight @refactoring.getReferenceRanges()
