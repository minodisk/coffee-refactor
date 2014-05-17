module.exports =
new class CoffeeRefactor extends require('atom-refactor').Main

  Watcher: require './Watcher'
  renameCommand: 'coffee-refactor:rename'
  refactorCommand: 'coffee-refactor:refactor'

  constructor: ->
    super
