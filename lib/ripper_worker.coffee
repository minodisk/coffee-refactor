class RipperWorker

  constructor: ->
    @worker = new Worker 'ripper.js'

  destruct: ->

  parse: (code, callback) ->
    @worker.on 'message', callback
    @worker.send code

  find: (point) ->
