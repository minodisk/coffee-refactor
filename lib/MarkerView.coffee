{ View } = require 'atom'

module.exports =
class RefactoringingView extends View

  @content: ->
    @div class: 'region'

  constructor: (editorView, { start, end }) ->
    super()

    tl = editorView.pixelPositionForBufferPosition start
    tr = editorView.pixelPositionForBufferPosition end
    @css
      left: tl.left
      top: tl.top
      width: tr.left - tl.left
      height: editorView.lineHeight * (end.row - start.row + 1)

  destruct: ->
