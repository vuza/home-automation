/*** HttpInbound Z-Way HA module *******************************************

 Version: 1.0.0
 -----------------------------------------------------------------------------
 Author: Marlon Alagoda <marlon@alagoda.at>
 Description: Listens to given port for HTTP events
 ******************************************************************************/

var vDev = null
var self = null
var path = ''

httpInbound = function () {
  return {status: 404, body: 'What do you want?'}
}

function HttpInbound (id, controller) {
  HttpInbound.super_.call(this, id, controller)
  self = this
}

inherits(HttpInbound, AutomationModule)

_module = HttpInbound

HttpInbound.prototype.init = function (config) {
  HttpInbound.super_.prototype.init.call(this, config)

  path = self.config.path

  createRoute()
  createVDev()
}

function createVDev() {
  vDev = self.controller.devices.create({
    deviceId: 'httpInbound_vDev_' + path + '_' + self.id,
    defaults: {
      metrics: {
        title: 'HTTP Inbound ' + path
      }
    },
    overlay: {
      deviceType: 'toggleButton',
      metrics: {
        icon: 'media',
        level: 'on'
      }
    },
    handler: function (cmd) {
      this.set('metrics:level', cmd)
    },
    moduleId: self.id
  })
}

function createRoute() {
  httpInbound[path] = function () {
    vDev.performCommand('on')

    return {status: 200, body: 'Ok'}
  }

  ws.allowExternalAccess('httpInbound.' + path)
}

HttpInbound.prototype.stop = function () {
  ws.revokeExternalAccess('httpInbound.' + path)
}