HighlightView = require './HighlightView'

module.exports =
class ReferenceView extends HighlightView

  @className: 'coffee-refactor-reference'
  configProperty: 'coffee-refactor.highlightReference'

  constructor: ->
    super
