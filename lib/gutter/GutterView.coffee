module.exports =
class GutterView

  constructor: (@gutter) ->
    super()

  reset: ->
    @gutter.removeClassFromAllLine 'coffee-refactor-warn coffee-refactor-error'
    @gutter
    .find '.line-number .icon-right'
    .attr 'title', ''

  update: (errors, warns) ->
    @reset()
    for warn in warns
      $row = @gutter.find gutter.getLineNumberElement warn.range.line_start
      $row.addClass 'coffee-refactor-warn'
    for error in errors
