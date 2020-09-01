import { NativeModules, NativeEventEmitter} from 'react-native';
import { Observable, Subscriber, from as ObservableFrom, fromEventPattern } from 'rxjs';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import { DiscoverHandler, BleManagerEventHandlers, NoParamsHandler } from '../../types/Handlers';
import { PeripheralConnectionOptions, PeripheralWriteOptions, PeripheralCharacteristicValueUpdate } from '../../types/Peripheral';
import { map, filter, pluck, take } from 'rxjs/operators';

function makeObservableForNativeEvent<T>(module: NativeEventEmitter, event: string): Observable<T> {
  return fromEventPattern(
    (handler) => module.addListener(event, handler),
    (_, subscription) => {
      subscription.remove();
    }
  );
};

const bleEmitter = new NativeEventEmitter(NativeModules.BleManager); 

const bleCharacteristicEmitter: Observable<any> = makeObservableForNativeEvent<any>(
  bleEmitter,
  'BleManagerDidUpdateValueForCharacteristic'
);

function scan(serviceUuids: string[] = [], seconds: number = 5, allowDuplicates: boolean = false): Observable<Peripheral> {
  const getPeripheralDiscoverHandler = (subscriber: Subscriber<Peripheral>): DiscoverHandler => (peripheral) => {
    subscriber.next(peripheral);
  };

  const getStopScanHandler = (subscriber: Subscriber<Peripheral>, eventSubscriptions: BleManagerEventHandlers): NoParamsHandler => () => {
    eventSubscriptions.discover?.remove();
    eventSubscriptions.stopScan?.remove();
    subscriber.complete();
  };

  BleManager.scan(serviceUuids, seconds, allowDuplicates);
  
  //TODO: Possibly refactor to use 'fromEventPattern' instead of verbosely creating the binding
  return new Observable((subscriber: Subscriber<Peripheral>) => {
    const handlers: BleManagerEventHandlers = {
      discover: bleEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        getPeripheralDiscoverHandler(subscriber)
      )
    };

    handlers.stopScan = bleEmitter.addListener(
      'BleManagerStopScan',
      getStopScanHandler(subscriber, handlers),
    );
  });
}

function getConnected(serviceUuids: string[] = []): Observable<Peripheral[]> {
  // I hope this works as stated above
  return ObservableFrom(BleManager.getConnectedPeripherals(serviceUuids));

}

function connectAndNotify(options: PeripheralConnectionOptions): Promise<void> {
  return BleManager.connect(options.id)
    .then(() => BleManager.retrieveServices(options.id))
    .then(() => 
      BleManager.startNotification(
        options.id,
        options.service,
        options.characteristic
      )
    );
}

function stopNotifyAndDisconnect(options: PeripheralConnectionOptions): Promise<void> {
  return BleManager.stopNotification(
    options.id,
    options.service,
    options.characteristic
  )
  .then(() => BleManager.disconnect(options.id))
  .catch((err) => {
    if(err.message === 'Device not connected') return;
    throw err;
  });
}

function write(options: PeripheralWriteOptions): Promise<void> {
  return BleManager.write(
    options.id,
    options.service,
    options.characteristic,
    options.payload
  );
}

function writeWithNotificationResponse(options: PeripheralWriteOptions): Observable<string[]> {

  const HEX_ARRAY: string[] = '0123456789ABCDEF'.split('');

  const intToHex = (val: number): string => {
    const v = val & 0xff;
    return `${HEX_ARRAY[v >>> 4]}${HEX_ARRAY[v & 0x0f]}`;
  }

  const byteListToHex = (byteList: number[]): string[]  => {
    return byteList.map(intToHex);
  }

  const checkEmission = (x: PeripheralCharacteristicValueUpdate): boolean => x.peripheral === options.id

  return new Observable((observer: Subscriber<string[]>) => {
    BleManager.write(
      options.id,
      options.service,
      options.characteristic,
      options.payload
    ).then(() => {
      bleCharacteristicEmitter.pipe(
        filter(checkEmission),
        pluck('value'),
        map(byteListToHex)
      )
      //ojalá no hayan race conditions
      .subscribe(observer);
    })
  });
}

//actually returns Promise<number>, blame it on the lib
function getSignal(peripheralId: string): Promise<any> {
  return BleManager.readRSSI(peripheralId)
}

export default {
  scan,
  getConnected,
  connectAndNotify,
  stopNotifyAndDisconnect,
  writeWithNotificationResponse,
  write,
  getSignal
}
