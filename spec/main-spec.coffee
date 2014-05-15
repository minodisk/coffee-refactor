path = require 'path'
fs = require 'fs'
{ inspect } = require 'util'
{ WorkspaceView } = require 'atom'
ErrorView = require '../lib/background/ErrorView.coffee'
ReferenceView = require '../lib/background/ReferenceView.coffee'

describe "CoffeeRefactor", ->
  [ editorView, editor, activationPromise, watcher ] = []

  beforeEach ->
    # Ready workspaceView
    atom.workspaceView = new WorkspaceView
    atom.project.setPath path.join __dirname, 'fixtures'
    atom.workspaceView.openSync 'fibonacci.coffee'
    atom.workspaceView.attachToDom()
    editorView = atom.workspaceView.getActiveView()
    editor = editorView.getEditor()

    # Load grammers about CoffeeScript
    languageCoffeeScriptPath = atom.packages.resolvePackagePath 'language-coffee-script'
    grammarDir = path.resolve languageCoffeeScriptPath, 'grammars'
    for filename in fs.readdirSync grammarDir
      atom.syntax.loadGrammarSync path.resolve grammarDir, filename

    # Activate coffee-refactor package
    activationPromise = atom.packages.activatePackage 'coffee-refactor'
    .then ({ mainModule }) ->
      watcher = mainModule.watchers[0]

  describe "when the coffee-refactor is activated", ->
    it "attaches the views", ->
      waitsForPromise ->
        activationPromise
      runs ->
        expect(atom.workspaceView.find(".#{ErrorView.className}")).toExist()
        expect(atom.workspaceView.find(".#{ReferenceView.className}")).toExist()
