/*** BatteryPolling Z-Way HA module *******************************************

 Version: 2.0.1
 (c) Z-Wave.Me, 2014
 -----------------------------------------------------------------------------
 Author: Gregory Sitnin <sitnin@z-wave.me> nad Serguei Poltorak <ps@z-wave.me>
 Description:
 This module periodically requests all battery devices for battery level report

 ******************************************************************************/

// ----------------------------------------------------------------------------
// --- Class definition, inheritance and setup
// ----------------------------------------------------------------------------

function BatteryPolling(id, controller) {
    // Call superconstructor first (AutomationModule)
    BatteryPolling.super_.call(this, id, controller);
}

inherits(BatteryPolling, AutomationModule);

_module = BatteryPolling;

//Perform Enums
var PerformEnum = {
    INIT: {value: 0, name: "init", code: "IN", vDevname: "Battery_Polling_Init"},
    UPDATE: {value: 1, name: "Update", code: "UP", vDevname: "Battery_Update"},
    DFULL: {value: 2, name: "DevicesFull", code: "DF", vDevname: "Battery_Devices_Full"},
    DLOW: {value: 3, name: "DevicesLow", code: "DL", vDevname: "Battery_Devices_Low"},
    STOP: {value: 4, name: "stop", code: "ST", vDevname: "Battery_Polling_Stop"},


};
//State Enums
var StateStatus = {
    INIT: "init",
    STOPPED: "stop",
    RUNNING: "run"
}
var StateEnum = {
    FULL: {value: 0, name: "full", code: "f", vDevname: "Batteries_Full", StateStatus: StateStatus.STOPPED},
    LOW: {value: 1, name: "low", code: "l", vDevname: "Batteries_Low", StateStatus: StateStatus.STOPPED},
    INITIAL: {
        value: 2,
        name: "initial",
        code: "I",
        vDevname: "Batterie_Polling_Initial",
        StateStatus: StateStatus.STOPPED
    },
    UPDATE: {
        value: 3,
        name: "update",
        code: "U",
        vDevname: "Batterie_Polling_Update",
        StateStatus: StateStatus.STOPPED
    },
    EXIT: {value: 4, name: "exit", code: "E", vDevname: "Batterie_Polling_Exit", StateStatus: StateStatus.STOPPED},

};

BatteryPolling.prototype.log = function (level, message, stringify) {
    var self = this;
    if (stringify) {
        self.controller.addNotification(level, JSON.stringify(message, null, 4), "module", "PersonIdentificationModule");
        console.log(JSON.stringify(message, null, 4));
    } else {
        self.controller.addNotification(level, message, "module", "PersonIdentificationModule");
        console.log(message);
    }
};
//State Definition
function State(stateEnum, entry, make, exit) {
    this.stateEnum = stateEnum;
    var entry = entry;
    var make = make;
    var exit = exit;
    this.doEntry = function () {
        stateEnum.StateStatus = StateStatus.INIT;
        entry();
    };
    this.doMake = function (args) {
        if (stateEnum.StateStatus === StateStatus.INIT) {
            stateEnum.StateStatus = StateStatus.RUNNING;
            make(args);
        }

    };
    this.doExit = function () {
        if (stateEnum.StateStatus === StateStatus.RUNNING) {

            exit();
            stateEnum.StateStatus = StateStatus.STOPPED;
        }

    };

}
BatteryPolling.prototype.log = function (level, message, stringify) {
    var self = this;
    if (stringify) {
        self.controller.addNotification(level, JSON.stringify(message, null, 4), "module", "PersonIdentificationModule");
        console.log(JSON.stringify(message, null, 4));

    } else {
        self.controller.addNotification(level, message, "module", "PersonIdentificationModule");
        console.log(message);
    }
};

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------
BatteryPolling.prototype.initStates = function () {
    var self = this;
    //--State--
    self.initState = new State(StateEnum.INITIAL,
        function () {
            self.makeVDev();
            self.makeDeviceMethods();
            self.register();
        }, function () {
            self.vDev.performCommand(PerformEnum.UPDATE.name);
        },
        function () {
        });
    self.exitState = new State(StateEnum.EXIT,
        function () {
            self.unRegister();
        }, function () {
        },
        function () {
        });
    //--State--
    self.full = new State(StateEnum.FULL,
        function () {
            //self.log("error", "full", true);

        }, function (args) {
            //self.log("error", args, true);

        },
        function () {
        });
    self.low = new State(StateEnum.LOW,
        function () {
            //self.log("error", "empty", true);

        }, function (args) {
            self.controller.addNotification("warning", langFile.warning + args, "battery", self.vDev.get("id"));
            self.log("warning", langFile.warning + args, true);
        },
        function () {
        });
    self.update = new State(StateEnum.UPDATE,
        function () {
        }, function () {
            self.onPoll();
        },
        function () {
        });

    self.state = self.initState;
    self.state.doEntry();
    self.state.doMake();
}
BatteryPolling.prototype.transition = function (condition, newState, args) {
    var self = this;
    if (condition) {
        self.state.doExit();
        self.state = newState;
        self.state.doEntry();
        self.state.doMake(args);

    }
};


BatteryPolling.prototype.makeVDev = function () {
    // create vDev
    var self = this;
    self.vDev = self.controller.devices.create({
        deviceId: "BatteryPolling_" + this.id,
        defaults: {
            deviceType: "battery",
            metrics: {
                probeTitle: "Battery",
                scaleTitle: "%",
                title: "Battery digest " + this.id
            }
        },
        overlay: {},
        handler: function (command, args) {
            var returnState = {
                'code': 2,
                'runningState': "undefined"
            };
            switch (command) {
                case PerformEnum.INIT.name:
                    self.transition(false, self.initState, args)
                    break;
                case PerformEnum.STOP.name:
                    self.transition(/**condition**/true, self.exitState, args)
                    break;
                case PerformEnum.DFULL.name:
                    self.transition(self.state.stateEnum===StateEnum.UPDATE, self.full, args)
                    break;
                case PerformEnum.DLOW.name:
                    self.transition(self.state.stateEnum===StateEnum.UPDATE, self.low, args)
                    break;
                case PerformEnum.UPDATE.name:
                    self.transition([StateEnum.INIT, StateEnum.DFULL, StateEnum.DLOW].indexOf(self.state.stateEnum) === -1, self.update, args)
                    break;
            }
        },

        moduleId: this.id
    });
}
BatteryPolling.prototype.unRegister = function () {
    var self = this;
    self.controller.devices.remove(this.vDev.id);
    self.controller.devices.off("change:metrics:level", self.onMetricUpdated);
    self.controller.emit("cron.removeTask", "batteryPolling.poll");
    self.controller.off("batteryPolling.poll", this.onPoll);
}
BatteryPolling.prototype.register = function () {
    var self = this;
    // Setup event listeners
    this.controller.devices.on("change:metrics:level", self.onMetricUpdated);
    // set up cron handler
    this.controller.on("batteryPolling.poll", this.onPoll);
    // Every Day is equal -1 in module.json
    var everyDay = -1;
    if (this.config.launchWeekDay == everyDay) {
        // add cron schedule every day
        this.controller.emit("cron.addTask", "batteryPolling.poll", {
            minute: null,
            hour: 0,
            weekDay: null,
            day: null,
            month: null
        });
    }
    else {
        // add cron schedule every week
        this.controller.emit("cron.addTask", "batteryPolling.poll", {
            minute: 0,
            hour: 0,
            weekDay: this.config.launchWeekDay,
            day: null,
            month: null
        });
    }

    // run first time to set up the value
    this.onMetricUpdated();
};

BatteryPolling.prototype.makeDeviceMethods = function () {
    var self = this;
    self.onPoll = function () {
        self.controller.devices.filter(function (el) {
            return (el.get("deviceType") === "battery" && (el.id !== "BatteryPolling_" + self.id));
        }).map(function (el) {
            el.performCommand("update");
        });
    };

    self.onMetricUpdated = function (vDev) {
        if (!vDev || vDev.id === self.vDev.id) {
            return; // prevent infinite loop with updates from itself and allows first fake update
        }

        if (vDev.get("deviceType") !== "battery") {
            return;
        }

        if (vDev.get("metrics:level") <= parseInt(self.config.warningLevel, 10)) {
            self.vDev.performCommand(PerformEnum.DLOW.name,vDev.get("metrics:title"))
        } else {
            self.vDev.performCommand(PerformEnum.DFULL.name,vDev.get("metrics:title"))
        }
        self.vDev.set("metrics:level", self.minimalBatteryValue());

    };
}
BatteryPolling.prototype.init = function (config) {
    BatteryPolling.super_.prototype.init.call(this, config);
    this.initStates();
};

BatteryPolling.prototype.stop = function () {
    BatteryPolling.super_.prototype.stop.call(this);
    this.vDev.performCommand(PerformEnum.STOP.name)
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

BatteryPolling.prototype.minimalBatteryValue = function () {
    var self = this,
        arr;

    arr = this.controller.devices.filter(function (vDev) {
        return vDev.get("deviceType") === "battery" && vDev.id != self.vDev.id;
    }).map(function (vDev) {
        return vDev.get("metrics:level");
    });
    arr.push(100);

    return Math.min.apply(null, arr);
}
