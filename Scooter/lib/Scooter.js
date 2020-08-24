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
      subscriber.next(data);
    },
  );
});

/*
public static String bytesToHex(byte[] bytes) {
    char[] hexChars = new char[bytes.length * 2];

    for (int j = 0; j < bytes.length; j++) {
        int v = 
        hexChars[j * 2] = HEX_ARRAY[v >>> 4];
        hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
    }

    return new String(hexChars);
}

bytes ->
                try {
                    val hexString = arrayOfNulls<String>(bytes.size)

                    for (i in bytes.indices) {
                        val temp = ByteArray(1)
                        temp[0] = bytes[i]
                        hexString[i] = HexString.bytesToHex(temp)
                    }


*/

const hexArray = '0123456789ABCDEF'.split('');

const intToHex = (val) => {
  const v = val & 0xFF;
  return `${hexArray[v >>> 4]}${hexArray[v & 0x0F]}`;
};

const bytesToHex = (byteList) => byteList.map(intToHex);

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
    // const payload = [90, -91, 1, 62, 32, 1, -78, 2, -21, -2];
    const payload = [90, -91, 1, 62, 34, 1, 50, 2, 105, -1];

    const parseForBattery = (data) => {
      const hexList = bytesToHex(data.value);
      console.log('hexList', hexList);
      const value = parseInt(hexList[8] + hexList[7], 16);
      return value;
    };

    console.log('sending payload', bytesToHex(payload));

    return new Observable((subscriber) => {
      BleManager.write(
        this.peripheralData.id,
        ScooterResources.service,
        ScooterResources.characteristics.write,
        payload,
      ).then(() => {
        bleManagerEvents.subscribe((data) => {
          subscriber.next(parseForBattery(data));
        });
      });
    });
  }

  watchSignal(time = 3000) {
    return new Observable((subscriber) => {
      let id = setInterval(() => {
        console.log('loop');
        BleManager.readRSSI(this.id).then((rssi) => {
          subscriber.next(rssi);
        });
      }, time);
      return () => {
        clearInterval(id);
        subscriber.complete();
      };
    });
  }
}
