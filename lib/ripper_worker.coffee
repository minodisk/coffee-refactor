{ join } = require 'path'
{ EventEmitter2 } = require 'eventemitter2'
{ max } = Math


module.exports =
class RipperWorker extends EventEmitter2

  @scopeNames: [
    'source.coffee'
    'source.litcoffee'
  ]

  constructor: ->
    @times = {}
    @worker = new Worker join __dirname, 'ripper.js'
    @worker.addEventListener 'message', @onMessaged

  destruct: ->
    @worker.removeEventListener 'message', @onMessaged

  stamp: (callback) ->
    newTime = new Date().getTime()
    oldTime = @times[callback]
    oldTime ?= newTime
    @times[callback] = max oldTime, newTime
    newTime

  parse: (code, callback) ->
    timestamp = @stamp callback
    @worker.postMessage
      timestamp: timestamp
      method: 'parse'
      args: [ code ]
      callback: callback

  find: (point, callback) ->
    timestamp = @stamp callback
    @worker.postMessage
      timestamp: timestamp
      method: 'find'
      args: [ point ]
      callback: callback

  onMessaged: ({ data: { method, callback, timestamp, returns }}) =>
    return unless @times[callback] is timestamp
    @emit callback, returns
