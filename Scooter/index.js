import {NativeModules, NativeEventEmitter} from 'react-native';
import BleManager from 'react-native-ble-manager';
import {Observable} from 'rxjs';

import ScooterResources from './lib/enums/ScooterResources';
import Scooter from './lib/Scooter';

const getPeripheralDiscoverHandler = (subscriber) => (peripheral) => {
  subscriber.next(new Scooter(peripheral));
};

const getStopScanHandler = (subscriber, eventSubscriptions) => () => {
  eventSubscriptions.discover.remove();
  eventSubscriptions.stopScan.remove();
  subscriber.complete();
};

function getConnected() {
  return new Observable((subscriber) => {
    BleManager.getConnectedPeripherals([ScooterResources.service]).then(
      (peripherals) => {
        const scooters = peripherals.map((p) => new Scooter(p, true));
        subscriber.next(scooters);
        subscriber.complete();
      },
    );
  });
}

function searchScooters(timeout = 5) {
  const handleSubscriber = (subscriber) => {
    const bleEmitter = new NativeEventEmitter(NativeModules.BleManager);

    const handlers = {
      discover: bleEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        getPeripheralDiscoverHandler(subscriber),
      ),
    };

    handlers.stopScan = bleEmitter.addListener(
      'BleManagerStopScan',
      getStopScanHandler(subscriber, handlers),
    );
  };

  BleManager.scan([ScooterResources.service], timeout, false);

  return new Observable(handleSubscriber);
}

const boot = () => BleManager.start({showAlert: false});

export default {searchScooters, getConnected, boot};
