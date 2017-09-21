// TODO can i use more es6 features?

/** * Fibaro The Button Z-Way HA module ***************************************

 Version: 1.0.0
 -----------------------------------------------------------------------------
 Author: Marlon Alagoda
 Description: Fire usefull events on interactions with Fibaro's "The Button"
 ******************************************************************************/

function Ftb (id, controller) {
  // Call superconstructor first (AutomationModule)
  Ftb.super_.call(this, id, controller)
}

inherits(Ftb, AutomationModule)

_module = Ftb

/**
 * Get's called by framework on init
 * @param config - contains default values and values chosen by user via UI
 */
Ftb.prototype.init = function (config) {
  Ftb.super_.prototype.init.call(this, config)
  debugPrint('Fibaro\'s "The Button" module started #############################################################')

  const self = this
  const button = self.config.sourceDevice.button
  var lastEvent = {}

  self.buttons = [{
    name: '1',
    deviceType: 'toggleButton',
    icon: 'media',
    level: 'on'
  }, {
    name: '2',
    deviceType: 'toggleButton',
    icon: 'media',
    level: 'on'
  }, {
    name: '3',
    deviceType: 'toggleButton',
    icon: 'media',
    level: 'on'
  }, {
    name: '4',
    deviceType: 'toggleButton',
    icon: 'media',
    level: 'on'
  }, {
    name: '5',
    deviceType: 'toggleButton',
    icon: 'media',
    level: 'on'
  }, {
    name: 'long',
    deviceType: 'toggleButton',
    icon: 'media',
    level: 'on'
  }]
  self.vDevs = {}

  // Create dummy devices
  self.createDummyDevices()

  // Bind events
  self.controller.devices.on(button.device, 'change:metrics:level', function (event) {
    const updateTime = event.get('updateTime')

    // Handle event
    switch (parseInt(String(event.get('metrics').level).split('')[1])) {
      case 0:
        self.vDevs['1'].performCommand('on')
        console.log('PERFORMED CMD!')
        break
      case 2:
        self.vDevs['long'].performCommand('on')
        break
      case 3:
        self.vDevs['2'].performCommand('on')
        break
      case 4:
        self.vDevs['3'].performCommand('on')
        break
      case 5:
        self.vDevs['4'].performCommand('on')
        break
      case 6:
        self.vDevs['5'].performCommand('no')
        break
      default:
        debugPrint('Unknown event in Ftb app')
    }
  })
}

Ftb.prototype.createDummyDevices = function () {
  const self = this
  const buttonName = self.getInstanceTitle()

  for (var i in self.buttons) {
    var button = self.buttons[i]
    self.vDevs[button.name] = self.controller.devices.create({
      deviceId: 'ftb_' + button.name + '_' + self.id,
      defaults: {
        metrics: {
          title: buttonName + ' ' + button.name
        }
      },
      overlay: {
        deviceType: button.deviceType,
        metrics: {
          icon: button.icon,
          level: button.level
        }
      },
      handler: function (cmd, args) {
        // TODO necessary?
        this.set('metrics:level', cmd)
      },
      moduleId: self.id
    })
  }
}

Ftb.prototype.stop = function () {
  for (var i in Object.keys(this.vDevs)) {
    this.controller.devices.remove(this.vDevs[this.buttons[i].name].id)
  }

  Ftb.super_.prototype.stop.call(this)
}
