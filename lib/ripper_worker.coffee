{ join } = require 'path'
{ EventEmitter2 } = require 'eventemitter2'

module.exports =
class RipperWorker extends EventEmitter2

  @scopeNames: [
    'source.coffee'
    'source.litcoffee'
  ]

  constructor: ->
    @stacks = {}
    @worker = new Worker join __dirname, 'ripper.js'
    @worker.addEventListener 'message', @onMessaged

  destruct: ->

  onMessaged: ({ data: { method, timestamp, returns }}) =>
    for callback in @stacks[method + timestamp]
      callback returns
    delete @stacks[method + timestamp]

  parse: (code, callback) ->
    timestamp = new Date().getTime()
    @worker.postMessage
      timestamp: timestamp
      method: 'parse'
      args: [ code ]
    @pushStack 'parse', timestamp, callback

  find: (point, callback) ->
    timestamp = new Date().getTime()
    @worker.postMessage
      timestamp: timestamp
      method: 'find'
      args: [ point ]
    @pushStack 'find', timestamp, callback

  pushStack: (method, timestamp, callback) ->
    @stacks[method + timestamp] ?= []
    @stacks[method + timestamp].push callback
