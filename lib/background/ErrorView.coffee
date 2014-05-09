HighlightView = require './HighlightView'

module.exports =
class ErrorView extends HighlightView

  @className: 'error'
  configProperty: 'coffee-refactor.highlightError'

  constructor: ->
    super
