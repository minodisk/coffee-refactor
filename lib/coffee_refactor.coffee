Ripper = require './ripper'
NotificationView = require './notification_view'
{ packages: packageManager } = atom


module.exports =

  configDefaults:
    'disable in large files (chars)': 20000

  activate: ->
    atom.workspace.emit 'coffee-refactor-became-active'
    return if 'refactor' in packageManager.getAvailablePackageNames() and
              !packageManager.isPackageDisabled 'refactor'
    new NotificationView
  deactivate: ->
  serialize: ->
  Ripper: Ripper
