HighlightView = require './HighlightView'

module.exports =
class ReferenceView extends HighlightView

  @className: 'reference'
  configProperty: 'coffee-refactor.highlightReference'

  constructor: ->
    super
