{ View } = require 'atom'
RegionView = require './RegionView'

module.exports =
class MarkerView extends View

  @content: ->
    @div class: 'marker'

  constructor: (editorView, refactoring, { start, end }) ->
    super()
    for row in [start.row..end.row] by 1
      rowRange = refactoring.rangeForRow row
      tl = editorView.pixelPositionForBufferPosition if row is start.row then start else rowRange.start
      br = editorView.pixelPositionForBufferPosition if row is end.row then end else rowRange.end
      br.top += editorView.lineHeight
      @append new RegionView tl, br, row is start.row, row is end.row

  remove: ->
    @destruct()
    super

  destruct: ->
    console.log 'MarkerView::destruct'
