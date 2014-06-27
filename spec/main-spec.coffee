# path = require 'path'
# fs = require 'fs'
# { inspect } = require 'util'
# { WorkspaceView } = require 'atom'
#
#
# openFile = (filename) ->
#   atom.workspaceView = new WorkspaceView
#   atom.project.setPath path.join __dirname, 'fixtures'
#   atom.workspaceView.openSync filename
#   atom.workspaceView.attachToDom()
#   editorView = atom.workspaceView.getActiveView()
#   editor = editorView.getEditor()
#   { editorView, editor }
#
# loadLanguage = ->
#   languageCoffeeScriptPath = atom.packages.resolvePackagePath 'language-coffee-script'
#   grammarDir = path.resolve languageCoffeeScriptPath, 'grammars'
#   for filename in fs.readdirSync grammarDir
#     atom.syntax.loadGrammarSync path.resolve grammarDir, filename
#
# activatePackage = (callback) ->
#   activationPromise = atom.packages.activatePackage 'coffee-refactor'
#   .then ({ mainModule }) ->
#     callback mainModule.watchers[0]
#
#
# describe "main", ->
#
#   describe "when '.coffee' file is opened", ->
#
#     [ editorView, editor, activationPromise, watcher, errorView, referenceView ] = []
#
#     beforeEach ->
#       { editorView, editor } = openFile 'fibonacci.coffee'
#       loadLanguage()
#       activationPromise = activatePackage (w) ->
#         watcher = w
#
#     it "attaches the views", ->
#       waitsForPromise ->
#         activationPromise
#       runs ->
#         errorView = atom.workspaceView.find ".refactor-error"
#         referenceView = atom.workspaceView.find ".refactor-reference"
#         expect(errorView).toExist()
#         expect(referenceView).toExist()
#
#     it "activates watcher", ->
#       waitsForPromise ->
#         activationPromise
#       runs ->
#         expect(watcher.ripper).toBeDefined()
#
#     it "starts highlighting", ->
#       waitsForPromise ->
#         activationPromise
#       runs ->
#         expect(referenceView.find('.marker').length).toEqual 4
#
#     it "has single cursor", ->
#       waitsForPromise ->
#         activationPromise
#       runs ->
#         expect(editor.getCursors().length).toEqual 1
#
#     describe "when 'coffee-refactor:rename' event is triggered", ->
#
#       it "has multi-cursors", ->
#         atom.workspaceView.trigger 'coffee-refactor:rename'
#         waitsForPromise ->
#           activationPromise
#         runs ->
#           expect(editor.getCursors().length).toEqual 4
#
#     describe "when 'coffee-refactor:done' event is triggered", ->
#
#       it "has single cursor", ->
#         atom.workspaceView.trigger 'coffee-refactor:done'
#         waitsForPromise ->
#           activationPromise
#         runs ->
#           expect(editor.getCursors().length).toEqual 1
#
#   describe "when '.litcoffee' file is opened", ->
#
#     [ editorView, editor, activationPromise, watcher ] = []
#
#     beforeEach ->
#       { editorView, editor } = openFile 'fibonacci.litcoffee'
#       loadLanguage()
#       activationPromise = activatePackage (w) ->
#         watcher = w
#
#     it "attaches the views", ->
#       waitsForPromise ->
#         activationPromise
#       runs ->
#         expect(atom.workspaceView.find(".refactor-error")).toExist()
#         expect(atom.workspaceView.find(".refactor-reference")).toExist()
#
#     it "activates watcher", ->
#       waitsForPromise ->
#         activationPromise
#       runs ->
#         expect(watcher.ripper).toBeDefined()
