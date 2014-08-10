{ join } = require 'path'
{ EventEmitter2 } = require 'eventemitter2'

module.exports =
class RipperWorker extends EventEmitter2

  @scopeNames: [
    'source.coffee'
    'source.litcoffee'
  ]

  constructor: ->
    @worker = new Worker join __dirname, 'ripper.js'
    @worker.addEventListener 'message', @onMessaged

  destruct: ->

  onMessaged: ({ data: { method, returns }}) ->
    switch method
      when 'parse'
        @emit 'parsed', returns

  parse: (code, callback) ->
    @worker.postMessage
      method: 'parse'
      args: [ code ]

  find: (point) ->
    console.log 'find', point
    @worker.postMessage
      method: 'find'
      args: [ point ]
