HighlightView = require './HighlightView'

module.exports =
class ErrorView extends HighlightView

  @className: 'coffee-refactor-error'
  configProperty: 'coffee-refactor.highlightError'

  constructor: ->
    super
