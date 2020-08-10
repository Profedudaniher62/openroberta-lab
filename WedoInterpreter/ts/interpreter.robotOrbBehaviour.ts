import { ARobotBehaviour } from "interpreter.aRobotBehaviour";
import { State } from "interpreter.state";
import * as C from "interpreter.constants";
import * as U from "interpreter.util";

export class RobotOrbBehaviour extends ARobotBehaviour {

    /*
     * represents the state of connected orb devices with the following
     * structure: {<name of the device> { 1 : { tiltsensor : "0.0" }, 2 : {
     * motionsensor : "4.0 }, batterylevel : "100", button : "false" }
     */
    private btInterfaceFct;
    private toDisplayFct;
    private timers;
    private orb = {};
    private tiltMode = {
        UP: '3.0',
        DOWN: '9.0',
        BACK: '5.0',
        FRONT: '7.0',
        NO: '0.0'
    }

    constructor( btInterfaceFct: any, toDisplayFct: any ) {
        super();
        this.btInterfaceFct = btInterfaceFct;
        this.toDisplayFct = toDisplayFct;
        this.timers = {};
        this.timers['start'] = Date.now();

        U.loggingEnabled( true, true );
    }

    public update( data ) {
        U.info( 'update type:' + data.type + ' state:' + data.state + ' sensor:' + data.sensor + ' actor:' + data.actuator );
        if ( data.target !== "orb" ) {
            return;
        }
        switch ( data.type ) {
            case "connect":
                if ( data.state == "connected" ) {
                    this.orb[data.brickid] = {};
                    this.orb[data.brickid]["brickname"] = data.brickname.replace( /\s/g, '' ).toUpperCase();
                    // for some reason we do not get the inital state of the button, so here it is hardcoded
                    this.orb[data.brickid]["button"] = 'false';
                } else if ( data.state == "disconnected" ) {
                    delete this.orb[data.brickid];
                }
                break;
            case "didAddService":
                let theOrbA = this.orb[data.brickid];
                if ( data.state == "connected" ) {
                    if ( data.id && data.sensor ) {
                        theOrbA[data.id] = {};
                        theOrbA[data.id][this.finalName( data.sensor )] = '';
                    } else if ( data.id && data.actuator ) {
                        theOrbA[data.id] = {};
                        theOrbA[data.id][this.finalName( data.actuator )] = '';
                    } else if ( data.sensor ) {
                        theOrbA[this.finalName( data.sensor )] = '';
                    } else {
                        theOrbA[this.finalName( data.actuator )] = '';
                    }
                }
                break;
            case "didRemoveService":
                if ( data.id ) {
                    delete this.orb[data.brickid][data.id];
                } else if ( data.sensor ) {
                    delete this.orb[data.brickid][this.finalName( data.sensor )]
                } else {
                    delete this.orb[data.brickid][this.finalName( data.actuator )]
                }
                break;
            case "update":
                let theOrbU = this.orb[data.brickid];
                if ( data.id ) {
                    if ( theOrbU[data.id] === undefined ) {
                        theOrbU[data.id] = {};
                    }
                    theOrbU[data.id][this.finalName( data.sensor )] = data.state;
                } else {
                    theOrbU[this.finalName( data.sensor )] = data.state;
                }
                break;
            default:
                // TODO think about what could happen here.
                break;
        }
        U.info( this.orb );
    }

    public getConnectedBricks() {
        var brickids = [];
        for ( var brickid in this.orb ) {
            if ( this.orb.hasOwnProperty( brickid ) ) {
                brickids.push( brickid );
            }
        }
        return brickids;
    }

    public getBrickIdByName( name ) {
        for ( var brickid in this.orb ) {
            if ( this.orb.hasOwnProperty( brickid ) ) {
                if ( this.orb[brickid].brickname === name.toUpperCase() ) {
                    return brickid;
                }
            }
        }
        return null;
    }

    public getBrickById( id ) {
        return this.orb[id];
    }

    public clearDisplay() {
        U.debug( 'clear display' );
        this.toDisplayFct( { "clear": true } );
    }

    public getSample( s: State, name: string, sensor: string, port: number, slot: string ) {
        var robotText = 'robot: ' + name + ', port: ' + port;
        U.info( robotText + ' getsample called for ' + sensor );
        var sensorName;
        switch ( sensor ) {
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
                s.push( this.timerGet( port ) );
                return;
            default:
                throw 'invalid get sample for ' + name + ' - ' + port + ' - ' + sensor + ' - ' + slot;
        }
        let orbId = this.getBrickIdByName( name );
        s.push( this.getSensorValue( orbId, port, sensorName, slot ) );
    }

    private getSensorValue( orbId, port, sensor, slot ) {
        let theOrb = this.orb[orbId];
        let thePort = theOrb[port];
        if ( thePort === undefined ) {
            thePort = theOrb["1"] !== undefined ? theOrb["1"] : theOrb["2"];
        }
        let theSensor = thePort === undefined ? "undefined" : thePort[sensor];
        U.info( 'sensor object ' + ( theSensor === undefined ? "undefined" : theSensor.toString() ) );
        switch ( sensor ) {
            case "tiltsensor":
                if ( slot === "ANY" ) {
                    return parseInt( theSensor ) !== parseInt( this.tiltMode.NO );
                } else {
                    return parseInt( theSensor ) === parseInt( this.tiltMode[slot] );
                }
            case "motionsensor":
                return parseInt( theSensor );
            case "button":
                return theOrb.button === "true";
        }
    }

    private finalName( notNormalized: string ): string {
        if ( notNormalized !== undefined ) {
            return notNormalized.replace( /\s/g, '' ).toLowerCase();
        } else {
            U.info( "sensor name undefined" );
            return "undefined";
        }
    }

    public timerReset( port: number ) {
        this.timers[port] = Date.now();
        U.debug( 'timerReset for ' + port );
    }

    public timerGet( port: number ) {
        const now = Date.now();
        var startTime = this.timers[port];
        if ( startTime === undefined ) {
            startTime = this.timers['start'];
        }
        const delta = now - startTime;
        U.debug( 'timerGet for ' + port + ' returned ' + delta );
        return delta;
    }

    public ledOnAction( name: string, port: number, color: number ) {
        var brickid = this.getBrickIdByName( name );
        const robotText = 'robot: ' + name + ', port: ' + port;
        U.debug( robotText + ' led on color ' + color );
        const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'light', 'brickid': brickid, 'color': color };
        this.btInterfaceFct( cmd );
    }

    public statusLightOffAction( name: string, port: number ) {
        var brickid = this.getBrickIdByName( name );
        const robotText = 'robot: ' + name + ', port: ' + port;
        U.debug( robotText + ' led off' );
        const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'light', 'brickid': brickid, 'color': 0 };
        this.btInterfaceFct( cmd );
    }

    public toneAction( name: string, frequency: number, duration: number ) {
        var brickid = this.getBrickIdByName( name ); // TODO: better style
        const robotText = 'robot: ' + name;
        U.debug( robotText + ' piezo: ' + ', frequency: ' + frequency + ', duration: ' + duration );
        const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'piezo', 'brickid': brickid, 'frequency': Math.floor( frequency ), 'duration': Math.floor( duration ) };
        this.btInterfaceFct( cmd );
        return duration;
    }

    public motorOnAction( name: string, port: any, duration: number, speed: number ): number {
        var brickid = this.getBrickIdByName( name ); // TODO: better style
        const robotText = 'robot: ' + name + ', port: ' + port;
        const durText = duration === undefined ? ' w.o. duration' : ( ' for ' + duration + ' msec' );
        U.debug( robotText + ' motor speed ' + speed + durText );
        const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'on', 'id': port, 'direction': speed < 0 ? 1 : 0, 'power': Math.abs( speed ) };
        this.btInterfaceFct( cmd );
        return 0;
    }

    public motorStopAction( name: string, port: number ) {
        var brickid = this.getBrickIdByName( name ); // TODO: better style
        const robotText = 'robot: ' + name + ', port: ' + port;
        U.debug( robotText + ' motor stop' );
        const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'stop', 'id': port };
        this.btInterfaceFct( cmd );
    }

    public showTextAction( text: any, _mode: string ): number {
        const showText = "" + text;
        U.debug( '***** show "' + showText + '" *****' );
        this.toDisplayFct( { "show": showText } );
        return 0;
    }

    public showImageAction( _text: any, _mode: string ): number {
        U.debug( '***** show image not supported by Orb *****' );
        return 0;
    }

    public displaySetBrightnessAction( _value: number ): number {
        return 0;
    }

    public displaySetPixelAction( _x: number, _y: number, _brightness: number ): number {
        return 0;
    }

    public writePinAction( _pin: any, _mode: string, _value: number ): void {
    }

    public close() {
        var ids = this.getConnectedBricks();
        for ( let id in ids ) {
            if ( ids.hasOwnProperty( id ) ) {
                var name = this.getBrickById( ids[id] ).brickname;
                this.motorStopAction( name, 1 );
                this.motorStopAction( name, 2 );
                this.ledOnAction( name, 99, 3 );
            }
        }
    }

    public encoderReset( _port: string ): void {
        throw new Error( "Method not implemented." );
    }

    public gyroReset( _port: number ): void {
        throw new Error( "Method not implemented." );
    }

    public lightAction( _mode: string, _color: string ): void {
        throw new Error( "Method not implemented." );
    }

    public playFileAction( _file: string ): number {
        throw new Error( "Method not implemented." );
    }

    public _setVolumeAction( _volume: number ): void {
        throw new Error( "Method not implemented." );
    }

    public _getVolumeAction( _s: State ): void {
        throw new Error( "Method not implemented." );
    }

    public setLanguage( _language: string ): void {
        throw new Error( "Method not implemented." );
    }

    public sayTextAction( _text: string, _speed: number, _pitch: number ): number {
        throw new Error( "Method not implemented." );
    }

    public getMotorSpeed( _s: State, _name: string, _port: any ): void {
        throw new Error( "Method not implemented." );
    }

    public setMotorSpeed( _name: string, _port: any, _speed: number ): void {
        throw new Error( "Method not implemented." );
    }

    public driveStop( _name: string ): void {
        throw new Error( "Method not implemented." );
    }

    //Erstmal Port als Eingabe Eingeführt
    public driveAction( name: string, direction: string, speed: number, distance: number): number {
         var brickid = this.getBrickIdByName( name );
         const robotText = 'robot: ' + name + ', direction: ' + direction;
         const durText = distance === undefined ? ' w.o. duration' : (' for ' + distance + ' msec');
         U.debug(robotText + ' motor speed ' + speed + durText);
         // This is to handle negative values entered in the distance parameter in the drive block
         if ((direction != C.FOREWARD && distance > 0) || (direction == C.FOREWARD && distance < 0) || (direction != C.FOREWARD && !distance)) {
             speed *= -1;
         }
         // This is to handle 0 distance being passed in
         if (distance === 0) {
             speed = 0;
         }
         const rotationPerSecond = C.MAX_ROTATION * Math.abs(speed) / 100.0;
         if (rotationPerSecond == 0.0 || distance === undefined) {
            const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'drive', 'direction': speed < 0 ? 1 : 0, 'power': Math.abs( speed ) };
            this.btInterfaceFct( cmd );
             return 0;
         } else {
             const rotations = Math.abs(distance) / (C.WHEEL_DIAMETER * Math.PI);
             const distancee = rotations / rotationPerSecond * 1000;
             const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'drivefor', 'direction': speed < 0 ? 1 : 0, 'power': Math.abs( speed ), 'distance': distancee, };
             this.btInterfaceFct( cmd );
             return distancee;
         }
    }

    public curveAction( name: string, direction: string, speedL: number, speedR: number, distance: number ): number {
        var brickid = this.getBrickIdByName( name );
        const robotText = 'robot: ' + name + ', direction: ' + direction;
		const durText = distance === undefined ? ' w.o. duration' : (' for ' + distance + ' msec');
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
		const avgSpeed = 0.5 * (Math.abs(speedL) + Math.abs(speedR))
		const rotationPerSecond = C.MAX_ROTATION * avgSpeed / 100.0;
		if (rotationPerSecond == 0.0 || distance === undefined) {
            const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'steer', 'direction': speedL && speedR < 0 ? 1 : 0, 'powerR': Math.abs( speedR ), 'powerL': Math.abs( speedL ) };
            this.btInterfaceFct( cmd );
			return 0;
		} else {
            const rotations = Math.abs(distance) / (C.WHEEL_DIAMETER * Math.PI);
            const distancee = rotations / rotationPerSecond * 1000;
            const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'steerfor', 'direction': speedL && speedR < 0 ? 1 : 0, 'powerR': Math.abs( speedR ), 'powerL': Math.abs( speedL ), 'distance': distancee };
            this.btInterfaceFct( cmd );
			return distancee;
		}
    }

    public turnAction( name: string, direction: string, speed: number, angle: number ): number {
        var brickid = this.getBrickIdByName( name );
        const robotText = 'robot: ' + name + ', direction: ' + direction;
		const durText = angle === undefined ? ' w.o. duration' : (' for ' + angle + ' msec');
		U.debug(robotText + ' motor speed ' + speed + durText);
		// This is to handle negative values entered in the degree parameter in the turn block 
		if ((direction == C.LEFT && angle < 0) || (direction == C.RIGHT && angle < 0)) {
			speed *= -1;
		}
		// This is to handle an angle of 0 being passed in
		if (angle === 0) {
			speed = 0;
		}
        const rotationPerSecond = C.MAX_ROTATION * Math.abs(speed) / 100.0;
        // TODO Right or Left
		if (rotationPerSecond == 0.0 || angle === undefined) {
            const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'turn', 'direction': speed < 0 ? 1 : 0, 'power': Math.abs( speed ), 'RoL': direction };
            this.btInterfaceFct( cmd );
			return 0;
		} else {
            const rotations = C.TURN_RATIO * (Math.abs(angle) / 720.);
            const angel = rotations / rotationPerSecond * 1000;
            const cmd = { 'target': 'orb', 'type': 'command', 'actuator': 'motor', 'brickid': brickid, 'action': 'turnfor', 'direction': speed < 0 ? 1 : 0, 'power': Math.abs( speed ), 'angel': angel, 'RoL': direction };
            this.btInterfaceFct( cmd );
			return angel;
		}
    }

    public showTextActionPosition( _text: any, _x: number, _y: number ): void {
        throw new Error( "Method not implemented." );
    }

    public displaySetPixelBrightnessAction( _x: number, _y: number, _brightness: number ): number {
        throw new Error( "Method not implemented." );
    }

    public displayGetPixelBrightnessAction( _s: State, _x: number, _y: number ): void {
        throw new Error( "Method not implemented." );
    }

    public setVolumeAction( _volume: number ): void {
        throw new Error( "Method not implemented." );
    }
    public getVolumeAction( _s: State ): void {
        throw new Error( "Method not implemented." );
    }
    public debugAction( _value: any ): void {
        this.showTextAction( "> " + _value, undefined );
    }
    public assertAction( _msg: string, _left: any, _op: string, _right: any, _value: any ): void {
        if ( !_value ) {
            this.showTextAction( "> Assertion failed: " + _msg + " " + _left + " " + _op + " " + _right, undefined );
        }
    }
}
