Ripper = require './Ripper'
ReferenceView = require './background/ReferenceView'
ErrorView = require './background/ErrorView'
GutterView = require './gutter/GutterView'
StatusView = require './status/StatusView'
{ locationDataToRange } = require './utils/LocationDataUtil'

module.exports =
class Watcher

  constructor: (@editorView) ->
    @editor = @editorView.editor

    # Setup model
    @ripper = new Ripper

    # Setup views
    @referenceView = new ReferenceView
    @editorView.underlayer.append @referenceView
    @errorView = new ErrorView
    @editorView.underlayer.append @errorView
    @gutterView = new GutterView @editorView.gutter
    @statusView = new StatusView

    # Listen
    @startListeningCursorMoved()
    @editor.on 'grammar-changed', @checkGrammar
    @editor.on 'destroyed', @destruct
    atom.workspaceView.command 'coffee-refactor:rename', @onRename
    atom.workspaceView.command 'coffee-refactor:done', @onDone

    # Execution
    @checkGrammar()

  destruct: =>
    @editorView.off 'cursor:moved', @onCursorMoved
    @editor.off 'grammar-changed', @checkGrammar
    @editor.buffer.off 'changed', @onBufferChanged

    @ripper.destruct()
    @referenceView.destruct()
    @errorView.destruct()
    @gutterView.destruct()
    @statusView.destruct()

    delete @editorView
    delete @editor
    delete @ripper


  checkGrammar: =>
    @isCoffee = @editor.getGrammar().name is 'CoffeeScript'
    @editor.buffer.off 'changed', @onBufferChanged
    if @isCoffee
      @editor.buffer.on 'changed', @onBufferChanged
      @parse()


  ###
  Reference finder process
  1. Detect buffer change.
  2. Stop listening cursor move event.
  3. Parse.
  4. Show errors and exit process when compile error is thrown.
  5. Show references.
  6. Start listening cursor move event.
  ###

  onBufferChanged: =>
    clearTimeout @timeoutId
    @timeoutId = setTimeout @parse, 0
    unless @isParsing
      @isParsing = true
      @stopListeningCursorMoved()
      @referenceView.empty()
      @errorView.empty()

  parse: =>
    text = @editor.buffer.getText()
    if text isnt @cachedText
      @cachedText = text
      @ripper.parse text, (err) =>
        if err?
          @showError err
          return
        @hideError()
    if @isParsing
      @isParsing = false
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
    @updateReferences()
    @startListeningCursorMoved()

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

  stopListeningCursorMoved: ->
    @editorView.off 'cursor:moved', @onCursorMoved

  startListeningCursorMoved: ->
    @stopListeningCursorMoved()
    @editorView.on 'cursor:moved', @onCursorMoved

  onCursorMoved: =>
    clearTimeout @timeoutId
    @timeoutId = setTimeout @updateReferences, 0


  ###
  Rename process
  1. Detect rename command.
  2. Cancel and exit process when cursor is moved out from the symbol.
  3. Detect done command.
  ###

  onRename: (e) =>
    cursor = @editor.cursors[0]
    range = cursor.getCurrentWordBufferRange includeNonWordCharacters: false
    refRanges = @ripper.find range
    if refRanges.length is 0
      e.abortKeyBinding()
      return

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

  cancel: =>
    return if not @renameInfo? or
                  @renameInfo.range.start.isEqual @renameInfo.cursor.getCurrentWordBufferRange(includeNonWordCharacters: false).start

    # Set cursor position to current position.
    # Stop listening cursor moved event.
    # Destroy cursor info.
    @editor.setCursorBufferPosition @renameInfo.cursor.getBufferPosition()
    @editorView.off 'cursor:moved', @cancel
    delete @renameInfo

  onDone: (e) =>
    unless @renameInfo?
      e.abortKeyBinding()
      return

    # Set cursor position to current position.
    # Stop listening cursor moved event.
    # Destroy cursor info.
    @editor.setCursorBufferPosition @renameInfo.cursor.getBufferPosition()
    @editorView.off 'cursor:moved', @cancel
    delete @renameInfo


  # Range to pixel based start and end range for each row.
  rangeToRows: ({ start, end }) ->
    for row in [start.row..end.row] by 1
      rowRange = @editor.buffer.rangeForRow row
      point =
        left : if row is start.row then start else rowRange.start
        right: if row is end.row then end else rowRange.end
      pixel =
        tl: @editorView.pixelPositionForBufferPosition point.left
        br: @editorView.pixelPositionForBufferPosition point.right
      pixel.br.top += @editorView.lineHeight
      pixel
