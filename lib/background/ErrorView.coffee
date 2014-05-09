{ config } = atom
{ View } = require 'atom'
MarkerView = require './MarkerView'

module.exports =
class ErrorView extends View

  @content: ->
    @div class: 'error'

  constructor: (@editorView, @refactoring) ->
    super()
    config.observe 'coffee-refactor.highlightError', =>
      @setEnabled config.get 'coffee-refactor.highlightError'

  update: (@errors) ->
    @empty()
    @render()

  render: =>
    return unless @errors?.length
    for { range, message } in @errors
      @append new MarkerView @editorView, @refactoring, range

  setEnabled: (isEnabled) ->
    if isEnabled
      @removeClass 'is-disabled'
    else
      @addClass 'is-disabled'
