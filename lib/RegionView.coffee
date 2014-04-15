{ View } = require 'atom'

module.exports =
class RegionView extends View

  @content: ->
    @div class: 'region highlight-info'

  constructor: (tl, br) ->
    super()
    @css
      left: tl.left
      top: tl.top
      width: br.left - tl.left
      height: br.top - tl.top

  remove: ->
    @destruct()
    super

  destruct: ->
    console.log 'RegionView::destruct'
