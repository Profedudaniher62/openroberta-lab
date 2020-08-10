var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "interpreter.aRobotBehaviour", "interpreter.constants", "interpreter.util"], function (require, exports, interpreter_aRobotBehaviour_1, C, U) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RobotOrbBehaviour = void 0;
    var RobotOrbBehaviour = /** @class */ (function (_super) {
        __extends(RobotOrbBehaviour, _super);
        function RobotOrbBehaviour(btInterfaceFct, toDisplayFct) {
            var _this = _super.call(this) || this;
            _this.orb = {};
            _this.tiltMode = {
                UP: '3.0',
                DOWN: '9.0',
                BACK: '5.0',
                FRONT: '7.0',
                NO: '0.0'
            };
            _this.btInterfaceFct = btInterfaceFct;
            _this.toDisplayFct = toDisplayFct;
            _this.timers = {};
            _this.timers['start'] = Date.now();
            U.loggingEnabled(true, true);
            return _this;
        }
        RobotOrbBehaviour.prototype.update = function (data) {
            U.info('update type:' + data.type + ' state:' + data.state + ' sensor:' + data.sensor + ' actor:' + data.actuator);
            if (data.target !== "orb") {
                return;
            }
            switch (data.type) {
                case "connect":
                    if (data.state == "connected") {
                        this.orb[data.brickid] = {};
                        this.orb[data.brickid]["brickname"] = data.brickname.replace(/\s/g, '').toUpperCase();
                        // for some reason we do not get the inital state of the button, so here it is hardcoded
                        this.orb[data.brickid]["button"] = 'false';
                    }
                    else if (data.state == "disconnected") {
                        delete this.orb[data.brickid];
                    }
                    break;
                case "didAddService":
                    var theOrbA = this.orb[data.brickid];
                    if (data.state == "connected") {
                        if (data.id && data.sensor) {
                            theOrbA[data.id] = {};
                            theOrbA[data.id][this.finalName(data.sensor)] = '';
                        }
                        else if (data.id && data.actuator) {
                            theOrbA[data.id] = {};
                            theOrbA[data.id][this.finalName(data.actuator)] = '';
                        }
                        else if (data.sensor) {
                            theOrbA[this.finalName(data.sensor)] = '';
                        }
                        else {
                            theOrbA[this.finalName(data.actuator)] = '';
                        }
                    }
                    break;
                case "didRemoveService":
                    if (data.id) {
                        delete this.orb[data.brickid][data.id];
                    }
                    else if (data.sensor) {
                        delete this.orb[data.brickid][this.finalName(data.sensor)];
                    }
                    else {
                        delete this.orb[data.brickid][this.finalName(data.actuator)];
                    }
                    break;
                case "update":
                    var theOrbU = this.orb[data.brickid];
                    if (data.id) {
                        if (theOrbU[data.id] === undefined) {
                            theOrbU[data.id] = {};
                        }
                        theOrbU[data.id][this.finalName(data.sensor)] = data.state;
                    }
                    else {
                        theOrbU[this.finalName(data.sensor)] = data.state;
                    }
                    break;
                default:
                    // TODO think about what could happen here.
                    break;
            }
            U.info(this.orb);
        };
        RobotOrbBehaviour.prototype.getConnectedBricks = function () {
            var brickids = [];
            for (var brickid in this.orb) {
                if (this.orb.hasOwnProperty(brickid)) {
                    brickids.push(brickid);
                }
            }
            return brickids;
        };
        RobotOrbBehaviour.prototype.getBrickIdByName = function (name) {
            for (var brickid in this.orb) {
                if (this.orb.hasOwnProperty(brickid)) {
                    if (this.orb[brickid].brickname === name.toUpperCase()) {
                        return brickid;
                    }
                }
            }
            return null;
        };
        RobotOrbBehaviour.prototype.getBrickById = function (id) {
            return this.orb[id];
        };
        RobotOrbBehaviour.prototype.clearDisplay = function () {
            U.debug('clear display');
            this.toDisplayFct({ "clear": true });
        };
        RobotOrbBehaviour.prototype.getSample = function (s, name, sensor, port, slot) {
            var robotText = 'robot: ' + name + ', port: ' + port;
            U.info(robotText + ' getsample called for ' + sensor);
            var sensorName;
            switch (sensor) {
                case "infrared":
                    sensorName = "motionsensor";
                    break;
                case "gyro":
                    sensorName = "tiltsensor";
                    break;
                case "buttons":
                    sensorName = "button";
                    break;
                case C.TIMER:
                    s.push(this.timerGet(port));
                    return;
                default:
                    throw 'invalid get sample for ' + name + ' - ' + port + ' - ' + sensor + ' - ' + slot;
            }
            var orbId = this.getBrickIdByName(name);
            s.push(this.getSensorValue(orbId, port, sensorName, slot));
        };
        RobotOrbBehaviour.prototype.getSensorValue = function (orbId, port, sensor, slot) {
            var theOrb = this.orb[orbId];
            var thePort = theOrb[port];
            if (thePort === undefined) {
                thePort = theOrb["1"] !== undefined ? theOrb["1"] : theOrb["2"];
            }
            var theSensor = thePort === undefined ? "undefined" : thePort[sensor];
            U.info('sensor object ' + (theSensor === undefined ? "undefined" : theSensor.toString()));
            switch (sensor) {
                case "tiltsensor":
                    if (slot === "ANY") {
                        return parseInt(theSensor) !== parseInt(this.tiltMode.NO);
                    }
                    else {
                        return parseInt(theSensor) === parseInt(this.tiltMode[slot]);
                    }
                case "motionsensor":
                    return parseInt(theSensor);
                case "button":
                    return theOrb.button === "true";
            }
        };
        RobotOrbBehaviour.prototype.finalName = function (notNormalized) {
            if (notNormalized !== undefined) {
                return notNormalized.replace(/\s/g, '').toLowerCase();
            }
            else {
                U.info("sensor name undefined");
                return "undefined";
            }
        };
        RobotOrbBehaviour.prototype.timerReset = function (port) {
            this.timers[port] = Date.now();
            U.debug('timerReset for ' + port);
        };
        RobotOrbBehaviour.prototype.timerGet = function (port) {
            var now = Date.now();
            var startTime = this.timers[port];
            if (startTime === undefined) {
                startTime = this.timers['start'];
            }
            var delta = now - startTime;
            U.debug('timerGet for ' + port + ' returned ' + delta);
            return delta;
        };
        RobotOrbBehaviour.prototype.ledOnAction = function (name, port, color) {
            var brickid = this.getBrickIdByName(name);
            var robotText = 'robot: ' + name + ', port: ' + port;
            U.debug(robotText + ' led on color ' + color);
            var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'light', 'brickid': brickid, 'color': color };
            this.btInterfaceFct(cmd);
        };
        RobotOrbBehaviour.prototype.statusLightOffAction = function (name, port) {
            var brickid = this.getBrickIdByName(name);
            var robotText = 'robot: ' + name + ', port: ' + port;
            U.debug(robotText + ' led off');
            var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'light', 'brickid': brickid, 'color': 0 };
            this.btInterfaceFct(cmd);
        };
        RobotOrbBehaviour.prototype.toneAction = function (name, frequency, duration) {
            var brickid = this.getBrickIdByName(name); // TODO: better style
            var robotText = 'robot: ' + name;
            U.debug(robotText + ' piezo: ' + ', frequency: ' + frequency + ', duration: ' + duration);
            var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'piezo', 'brickid': brickid, 'frequency': Math.floor(frequency), 'duration': Math.floor(duration) };
            this.btInterfaceFct(cmd);
            return duration;
        };
        RobotOrbBehaviour.prototype.motorOnAction = function (name, port, duration, speed) {
            var brickid = this.getBrickIdByName(name); // TODO: better style
            var robotText = 'robot: ' + name + ', port: ' + port;
            var durText = duration === undefined ? ' w.o. duration' : (' for ' + duration + ' msec');
            U.debug(robotText + ' motor speed ' + speed + durText);
            var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'on', 'id': port, 'direction': speed < 0 ? 1 : 0, 'power': Math.abs(speed) };
            this.btInterfaceFct(cmd);
            return 0;
        };
        RobotOrbBehaviour.prototype.motorStopAction = function (name, port) {
            var brickid = this.getBrickIdByName(name); // TODO: better style
            var robotText = 'robot: ' + name + ', port: ' + port;
            U.debug(robotText + ' motor stop');
            var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'stop', 'id': port };
            this.btInterfaceFct(cmd);
        };
        RobotOrbBehaviour.prototype.showTextAction = function (text, _mode) {
            var showText = "" + text;
            U.debug('***** show "' + showText + '" *****');
            this.toDisplayFct({ "show": showText });
            return 0;
        };
        RobotOrbBehaviour.prototype.showImageAction = function (_text, _mode) {
            U.debug('***** show image not supported by Orb *****');
            return 0;
        };
        RobotOrbBehaviour.prototype.displaySetBrightnessAction = function (_value) {
            return 0;
        };
        RobotOrbBehaviour.prototype.displaySetPixelAction = function (_x, _y, _brightness) {
            return 0;
        };
        RobotOrbBehaviour.prototype.writePinAction = function (_pin, _mode, _value) {
        };
        RobotOrbBehaviour.prototype.close = function () {
            var ids = this.getConnectedBricks();
            for (var id in ids) {
                if (ids.hasOwnProperty(id)) {
                    var name = this.getBrickById(ids[id]).brickname;
                    this.motorStopAction(name, 1);
                    this.motorStopAction(name, 2);
                    this.ledOnAction(name, 99, 3);
                }
            }
        };
        RobotOrbBehaviour.prototype.encoderReset = function (_port) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.gyroReset = function (_port) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.lightAction = function (_mode, _color) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.playFileAction = function (_file) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype._setVolumeAction = function (_volume) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype._getVolumeAction = function (_s) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.setLanguage = function (_language) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.sayTextAction = function (_text, _speed, _pitch) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.getMotorSpeed = function (_s, _name, _port) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.setMotorSpeed = function (_name, _port, _speed) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.driveStop = function (_name) {
            throw new Error("Method not implemented.");
        };
        //Erstmal Port als Eingabe Eingeführt
        RobotOrbBehaviour.prototype.driveAction = function (name, direction, speed, distance) {
            var brickid = this.getBrickIdByName(name);
            var robotText = 'robot: ' + name + ', direction: ' + direction;
            var durText = distance === undefined ? ' w.o. duration' : (' for ' + distance + ' msec');
            U.debug(robotText + ' motor speed ' + speed + durText);
            // This is to handle negative values entered in the distance parameter in the drive block
            if ((direction != C.FOREWARD && distance > 0) || (direction == C.FOREWARD && distance < 0) || (direction != C.FOREWARD && !distance)) {
                speed *= -1;
            }
            // This is to handle 0 distance being passed in
            if (distance === 0) {
                speed = 0;
            }
            var rotationPerSecond = C.MAX_ROTATION * Math.abs(speed) / 100.0;
            if (rotationPerSecond == 0.0 || distance === undefined) {
                var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'drive', 'direction': speed < 0 ? 1 : 0, 'power': Math.abs(speed) };
                this.btInterfaceFct(cmd);
                return 0;
            }
            else {
                var rotations = Math.abs(distance) / (C.WHEEL_DIAMETER * Math.PI);
                var distancee = rotations / rotationPerSecond * 1000;
                var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'drivefor', 'direction': speed < 0 ? 1 : 0, 'power': Math.abs(speed), 'distance': distancee, };
                this.btInterfaceFct(cmd);
                return distancee;
            }
        };
        RobotOrbBehaviour.prototype.curveAction = function (name, direction, speedL, speedR, distance) {
            var brickid = this.getBrickIdByName(name);
            var robotText = 'robot: ' + name + ', direction: ' + direction;
            var durText = distance === undefined ? ' w.o. duration' : (' for ' + distance + ' msec');
            U.debug(robotText + ' left motor speed ' + speedL + ' right motor speed ' + speedR + durText);
            // This is to handle negative values entered in the distance parameter in the steer block
            if ((direction != C.FOREWARD && distance > 0) || (direction == C.FOREWARD && distance < 0) || (direction != C.FOREWARD && !distance)) {
                speedL *= -1;
                speedR *= -1;
            }
            // This is to handle 0 distance being passed in
            if (distance === 0) {
                speedR = 0;
                speedL = 0;
            }
            var avgSpeed = 0.5 * (Math.abs(speedL) + Math.abs(speedR));
            var rotationPerSecond = C.MAX_ROTATION * avgSpeed / 100.0;
            if (rotationPerSecond == 0.0 || distance === undefined) {
                var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'steer', 'direction': speedL && speedR < 0 ? 1 : 0, 'powerR': Math.abs(speedR), 'powerL': Math.abs(speedL) };
                this.btInterfaceFct(cmd);
                return 0;
            }
            else {
                var rotations = Math.abs(distance) / (C.WHEEL_DIAMETER * Math.PI);
                var distancee = rotations / rotationPerSecond * 1000;
                var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'steerfor', 'direction': speedL && speedR < 0 ? 1 : 0, 'powerR': Math.abs(speedR), 'powerL': Math.abs(speedL), 'distance': distancee };
                this.btInterfaceFct(cmd);
                return distancee;
            }
        };
        RobotOrbBehaviour.prototype.turnAction = function (name, direction, speed, angle) {
            var brickid = this.getBrickIdByName(name);
            var robotText = 'robot: ' + name + ', direction: ' + direction;
            var durText = angle === undefined ? ' w.o. duration' : (' for ' + angle + ' msec');
            U.debug(robotText + ' motor speed ' + speed + durText);
            // This is to handle negative values entered in the degree parameter in the turn block 
            if ((direction == C.LEFT && angle < 0) || (direction == C.RIGHT && angle < 0)) {
                speed *= -1;
            }
            // This is to handle an angle of 0 being passed in
            if (angle === 0) {
                speed = 0;
            }
            var rotationPerSecond = C.MAX_ROTATION * Math.abs(speed) / 100.0;
            // TODO Right or Left
            if (rotationPerSecond == 0.0 || angle === undefined) {
                var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'turn', 'direction': speed < 0 ? 1 : 0, 'power': Math.abs(speed), 'RoL': direction };
                this.btInterfaceFct(cmd);
                return 0;
            }
            else {
                var rotations = C.TURN_RATIO * (Math.abs(angle) / 720.);
                var angel = rotations / rotationPerSecond * 1000;
                var cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'turnfor', 'direction': speed < 0 ? 1 : 0, 'power': Math.abs(speed), 'angel': angel, 'RoL': direction };
                this.btInterfaceFct(cmd);
                return angel;
            }
        };
        RobotOrbBehaviour.prototype.showTextActionPosition = function (_text, _x, _y) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.displaySetPixelBrightnessAction = function (_x, _y, _brightness) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.displayGetPixelBrightnessAction = function (_s, _x, _y) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.setVolumeAction = function (_volume) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.getVolumeAction = function (_s) {
            throw new Error("Method not implemented.");
        };
        RobotOrbBehaviour.prototype.debugAction = function (_value) {
            this.showTextAction("> " + _value, undefined);
        };
        RobotOrbBehaviour.prototype.assertAction = function (_msg, _left, _op, _right, _value) {
            if (!_value) {
                this.showTextAction("> Assertion failed: " + _msg + " " + _left + " " + _op + " " + _right, undefined);
            }
        };
        return RobotOrbBehaviour;
    }(interpreter_aRobotBehaviour_1.ARobotBehaviour));
    exports.RobotOrbBehaviour = RobotOrbBehaviour;
});
