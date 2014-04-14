{ View } = require 'atom'

module.exports =
class RefactoringingView extends View

  @content: ->
    @div class: 'region'

  constructor: (editorView, { start, end }) ->
    super()

    rowSpan = end.row - start.row
    start = editorView.pixelPositionForBufferPosition start
    end = editorView.pixelPositionForBufferPosition end
    console.log editorView.lineHeight, editorView.charWidth


  destruct: ->
