import {Platform} from 'react-native';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import BleManager, {Peripheral} from 'react-native-ble-manager';

import Manager from './lib/bluetooth/Manager';
import ScooterResources from './lib/enums/ScooterResources';
import Scooter from './lib/Scooter';


function getConnected(): Observable<Scooter[]> {
  const createConnectedScooters = (items: Peripheral[]): Scooter[] => 
    items.map((s: Peripheral)  => new Scooter(s, true));

  return Manager.getConnected([ScooterResources.service]).pipe(map(createConnectedScooters))
}

function searchScooters(timeout: number = 5): Observable<Scooter> {
  const createScooter = (item: Peripheral): Scooter => new Scooter(item);
  return Manager
    .scan([ScooterResources.service], timeout, false)
    .pipe(map(createScooter));
}

async function boot(): Promise<void> {
  if (Platform.OS === 'android') {
    await BleManager.enableBluetooth();
  }
  await BleManager.start({showAlert: false});
};

export default {searchScooters, getConnected, boot};
