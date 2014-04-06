# { Point, Range } = require 'atom'
# CoffeeRefactorView = require './coffee-refactor-view'
# { Point, Range } = require '/Applications/Atom.app/Contents/Resources/app/src/atom'
{ inspect } = require 'util'
coffee = require 'coffee-script'
_ = require 'underscore'
{ Lexer } = require '../node_modules/coffee-script/lib/coffee-script/lexer'
# console.log coffee, Lexer

module.exports =
  coffeeRefactorView: null

  activate: (state) ->
    # @coffeeRefactorView = new CoffeeRefactorView state.coffeeRefactorViewState
    atom.workspaceView.command "coffee-refactor:toggle", => @refact()

  deactivate: ->
    @coffeeRefactorView.destroy()

  serialize: ->
    coffeeRefactorViewState: @coffeeRefactorView.serialize()

  rename: ->
    editor = atom.workspace.getActiveEditor()
    editor.selectWord()
    word = editor.getSelectedText()
    code = editor.getText()
    selection = editor.getSelection 0
    @findRefs selection.initialScreenRange, code
