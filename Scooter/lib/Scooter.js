/* eslint-disable no-bitwise */
import {NativeEventEmitter, NativeModules} from 'react-native';
import {Observable} from 'rxjs';
import BleManager from 'react-native-ble-manager';

import ScooterResources from './enums/ScooterResources';

//for battery?
const bleManagerEvents = new Observable((subscriber) => {
  // eslint-disable-next-line prettier/prettier
  (new NativeEventEmitter(NativeModules.BleManager)).addListener(
    'BleManagerDidUpdateValueForCharacteristic',
    (data) => {
      console.log('received data from bleManager');
      subscriber.next(data);
    },
  );
});

export default class Scooter {
  constructor(data, connected = false) {
    this.peripheralData = data;
    this.isConnected = connected;
  }

  get id() {
    return this.peripheralData.id;
  }

  _boot() {
    return BleManager.connect(this.peripheralData.id)
      .then(() => BleManager.retrieveServices(this.peripheralData.id))
      .then(() =>
        BleManager.startNotification(
          this.peripheralData.id,
          ScooterResources.service,
          ScooterResources.characteristics.notify,
        ),
      );
  }

  _teardown() {
    return BleManager.stopNotification(
      this.peripheralData.id,
      ScooterResources.service,
      ScooterResources.characteristics.notify,
    ).then(() => BleManager.disconnect(this.peripheralData.id));
  }

  connect() {
    return new Observable((subscriber) => {
      this._boot().then(() => {
        this.isConnected = true;
        subscriber.next();
        subscriber.complete();
      });
    });
  }

  disconnect() {
    return new Observable((subscriber) => {
      this._teardown().then(() => {
        this.isConnected = false;
        subscriber.next();
        subscriber.complete();
      });
    });
  }

  lock() {
    if (!this.isConnected) {
      throw new Error('Scooter not connected');
    }

    //TODO: implement NbMessage lib to replace hardcoded payloads
    const payload = [90, -91, 1, 62, 32, 3, 112, 1, 44, -1];

    return new Observable((subscriber) => {
      BleManager.write(
        this.peripheralData.id,
        ScooterResources.service,
        ScooterResources.characteristics.write,
        payload,
      ).then(() => {
        subscriber.next();
        subscriber.complete();
      });
    });
  }

  unlock() {
    if (!this.isConnected) {
      throw new Error('Scooter not connected');
    }

    //TODO: implement NbMessage lib to replace hardcoded payloads
    const payload = [90, -91, 1, 62, 32, 3, 113, 1, 43, -1];

    return new Observable((subscriber) => {
      BleManager.write(
        this.peripheralData.id,
        ScooterResources.service,
        ScooterResources.characteristics.write,
        payload,
      ).then(() => {
        subscriber.next();
        subscriber.complete();
      });
    });
  }

  getBattery() {
    if (!this.isConnected) {
      throw new Error('Scooter not connected');
    }

    //TODO: implement NbMessage lib to replace hardcoded payloads
    const payload = [90, -91, 1, 62, 32, 1, -78, 2, -21, -2];

    return new Observable((subscriber) => {
      BleManager.write(
        this.peripheralData.id,
        ScooterResources.service,
        ScooterResources.characteristics.write,
        payload,
      ).then(() => {
        console.log('sent payload ', payload);
        console.log('subscribing to recieve data...');
        bleManagerEvents.subscribe((data) => subscriber.next(data));
      });
    });
  }
}
