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

    @css
      left: start.left
      top: start.top
      width: end.left - start.left
      height: editorView.lineHeight * (rowSpan + 1)

  destruct: ->
