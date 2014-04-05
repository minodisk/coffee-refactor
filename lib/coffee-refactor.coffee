CoffeeRefactorView = require './coffee-refactor-view'

module.exports =
  coffeeRefactorView: null

  activate: (state) ->
    @coffeeRefactorView = new CoffeeRefactorView(state.coffeeRefactorViewState)

  deactivate: ->
    @coffeeRefactorView.destroy()

  serialize: ->
    coffeeRefactorViewState: @coffeeRefactorView.serialize()
