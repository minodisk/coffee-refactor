{ View } = require 'atom'
MarkerView = require './MarkerView'

module.exports =
class ErrorView extends View

  @content: ->
    @div class: 'error'

  constructor: (@editorView, @refactoring) ->
    super()
    @isEnabled = false

  setEnabled: (@isEnabled) ->

  highlight: (ranges, message) =>
    return unless @isEnabled
    @empty()
    @highlightAt ranges

  highlightAt: (ranges) ->
    for range in ranges
      @append new MarkerView @editorView, @refactoring, range
