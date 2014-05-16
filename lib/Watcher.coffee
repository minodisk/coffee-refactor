{ EventEmitter } = require 'events'
Ripper = require './Ripper'
ReferenceView = require './background/ReferenceView'
ErrorView = require './background/ErrorView'
GutterView = require './gutter/GutterView'
StatusView = require './status/StatusView'
{ locationDataToRange } = require './utils/LocationDataUtil'

module.exports =
class Watcher extends EventEmitter

  constructor: (@editorView) ->
    super()
    @editor = @editorView.editor
    @editor.on 'grammar-changed', @checkGrammar
    @checkGrammar()

  destruct: =>
    @removeAllListeners()
    @deactivate()
    @editor.off 'grammar-changed', @checkGrammar

    delete @editorView
    delete @editor

  onDestroyed: =>
    @emit 'destroyed', @


  ###
  Grammar checker
  1. Detect grammar changed.
  2. Destroy instances and listeners.
  3. Exit when grammar isn't CoffeeScript.
  4. Create instances and listeners.
  ###

  checkGrammar: =>
    @deactivate()
    scopeName = @editor.getGrammar().scopeName
    return unless scopeName is 'source.coffee' or scopeName is 'source.litcoffee'
    @activate()

  activate: ->
    # Setup model
    @ripper = new Ripper

    # Setup views
    @referenceView = new ReferenceView
    @editorView.underlayer.append @referenceView
    @errorView = new ErrorView
    @editorView.underlayer.append @errorView
    @gutterView = new GutterView @editorView.gutter
    @statusView = new StatusView

    # Start listening
    @editorView.on 'cursor:moved', @onCursorMoved
    @editor.on 'destroyed', @onDestroyed
    @editor.buffer.on 'changed', @onBufferChanged

    # Execute
    @onBufferChanged()

  deactivate: ->
    # Stop listening
    @editorView.off 'cursor:moved', @onCursorMoved
    @editor.off 'destroyed', @onDestroyed
    @editor.buffer.off 'changed', @onBufferChanged

    # Destruct instances
    @ripper?.destruct()
    @referenceView?.destruct()
    @errorView?.destruct()
    @gutterView?.destruct()
    @statusView?.destruct()

    # Remove references
    delete @ripper
    delete @referenceView
    delete @errorView
    delete @gutterView
    delete @statusView


  ###
  Reference finder process
  1. Detect buffer changed.
  2. Stop listening cursor move event.
  3. Parse.
  4. Show errors and exit process when compile error is thrown.
  5. Show references.
  6. Start listening cursor move event.
  ###

  onBufferChanged: =>
    # clearTimeout @timeoutId
    # @timeoutId = setTimeout @parse, 0
    @hideError()
    @referenceView.update()
    @editorView.off 'cursor:moved', @onCursorMoved
    @parse()
    # unless @isParsing
    #   @isParsing = true

  parse: =>
    text = @editor.buffer.getText()
    if text isnt @cachedText
      @cachedText = text
      @ripper.parse text, (err) =>
        if err?
          @showError err
          return
        @hideError()
        @onParseEnd()
    else
      @onParseEnd()

  showError: ({ location, message }) =>
    return unless location?
    range = locationDataToRange location
    err =
      range  : range
      message: message
    @errorView.update [ @rangeToRows range ]
    @gutterView.update [ err ]

  hideError: =>
    @errorView.update()
    @gutterView.update()

  onParseEnd: =>
    # return unless @isParsing
    # @isParsing = false
    @updateReferences()
    @editorView.off 'cursor:moved', @onCursorMoved
    @editorView.on 'cursor:moved', @onCursorMoved

  updateReferences: =>
    ranges = []

    cursor = @editor.cursors[0]
    if cursor?
      range = cursor.getCurrentWordBufferRange includeNonWordCharacters: false
      unless range.isEmpty()
        ranges = @ripper.find range

    rowsList = for range in ranges
      @rangeToRows range
    @referenceView.update rowsList


  ###
  Cursor moved process
  1. Detect cursor moved.
  2. Update references.
  ###

  onCursorMoved: =>
    clearTimeout @timeoutId
    @timeoutId = setTimeout @updateReferences, 0


  ###
  Rename process
  1. Detect rename command.
  2. Cancel and exit process when cursor is moved out from the symbol.
  3. Detect done command.
  ###

  rename: ->
    return false unless @isActive()

    cursor = @editor.cursors[0]
    range = cursor.getCurrentWordBufferRange includeNonWordCharacters: false
    refRanges = @ripper.find range
    return false if refRanges.length is 0

    # Save cursor info.
    # Select all references.
    # Listen to cursor moved event.
    @renameInfo =
      cursor: cursor
      range : range
    for refRange in refRanges
      @editor.addSelectionForBufferRange refRange
    @editorView.off 'cursor:moved', @cancel
    @editorView.on 'cursor:moved', @cancel
    true

  cancel: =>
    return if not @renameInfo? or
                  @renameInfo.range.start.isEqual @renameInfo.cursor.getCurrentWordBufferRange(includeNonWordCharacters: false).start

    # Set cursor position to current position.
    # Stop listening cursor moved event.
    # Destroy cursor info.
    @editor.setCursorBufferPosition @renameInfo.cursor.getBufferPosition()
    @editorView.off 'cursor:moved', @cancel
    delete @renameInfo

  done: ->
    return false unless @isActive()
    return false unless @renameInfo?

    # Set cursor position to current position.
    # Stop listening cursor moved event.
    # Destroy cursor info.
    @editor.setCursorBufferPosition @renameInfo.cursor.getBufferPosition()
    @editorView.off 'cursor:moved', @cancel
    delete @renameInfo
    true


  ###
  Utility
  ###

  isActive: ->
    @ripper? and atom.workspaceView.getActivePaneItem() is @editor

  # Range to pixel based start and end range for each row.
  rangeToRows: ({ start, end }) ->
    for raw in [start.row..end.row] by 1
      rowRange = @editor.buffer.rangeForRow raw
      point =
        left : if raw is start.row then start else rowRange.start
        right: if raw is end.row then end else rowRange.end
      pixel =
        tl: @editorView.pixelPositionForBufferPosition point.left
        br: @editorView.pixelPositionForBufferPosition point.right
      pixel.br.top += @editorView.lineHeight
      pixel
