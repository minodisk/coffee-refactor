{View} = require 'atom'
coffee = require 'coffee-script'

console.log coffee

module.exports =
class CoffeeRefactorView extends View
  @content: ->
    @div class: 'coffee-refactor overlay from-top', =>
      @div "The CoffeeRefactor package is Alive! It's ALIVE!", class: "message"

  initialize: (serializeState) ->
    # atom.workspaceView.command "coffee-refactor:toggle", => @toggle()

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @detach()

  toggle: ->
    console.log "CoffeeRefactorView was toggled!"
    if @hasParent()
      @detach()
    else
      atom.workspaceView.append(this)
