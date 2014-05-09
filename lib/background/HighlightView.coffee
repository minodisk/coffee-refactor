{ View } = require 'atom'
MarkerView = require './MarkerView'
{ config } = atom

module.exports =
class HighlightView extends View

  @className: ''

  @content: ->
    @div class: @className


  configProperty: ''

  constructor: (@editorView, @refactoring) ->
    super()
    config.observe @configProperty, =>
      @setEnabled config.get @configProperty

  update: (ranges) ->
    @empty()
    return unless ranges?.length
    for range in ranges
      @append new MarkerView @editorView, @refactoring, range

  setEnabled: (isEnabled) ->
    if isEnabled
      @removeClass 'is-disabled'
    else
      @addClass 'is-disabled'
