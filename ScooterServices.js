/* eslint-disable no-bitwise */

const Scooter = Object.freeze({
  service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  characteristics: {
    notify: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
    write: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  },
});

// cuántos servicios+características tiene? un solo servicio con una caracteristica Notify y otra Write?
// R: si, un solo servicio con una caracteristica Notify y otra Write
// Cuál es el servicio y la característica de notify? hay que hacer una resubscripción cuando manda datos?
// R: Solo una subscripción, se  mantiene la subscripción y se anuncian nuevos datos, mismo principio de los observables
// los bytes de donde viene tiene valores de ida y vuelta "from master to battery & from battery to master" qué significa eso?
// los códigos arrancan siempre con 55 aa

// const _eventEmitter = new NativeEventEmitter(NativeModules.BleManager);
// const ScooterDataAnnouncer = {
//   checkers: [],
//   _handleReceivedData(data) {
//     // check all the checkers, respond to the ones the check passes
//     this.checkers
//       .filter(({check, id}) => data.peripheral === id && !!check(data.value))
//       .forEach(({resolve}) => resolve(data.value));
//   },

//   waitUntil(id, check) {
//     let promiseResolver = null;

//     const returnedPromise = new Promise((resolve) => {
//       promiseResolver = resolve;
//     });

//     this.checkers.push({
//       id,
//       check,
//       resolve: promiseResolver,
//     });
//     return returnedPromise;
//   },
// };

// ScooterDataAnnouncer._eventSubscription = _eventEmitter.addListener(
//   'BleManagerDidUpdateValueForCharacteristic',
//   ScooterDataAnnouncer._handleReceivedData.bind(ScooterDataAnnouncer),
// ),

// class Scooter {
//   constructor(scooter) {
//     this.id = scooter.id;
//     this.name = scooter.name || 'Unnamed Scooter';
//   }

//   //hooks to notification channel in order to listen to responses
//   async connect() {
//     //  needed in order for BleManager to recognize the services, not really used so value would not be stored
//     await BleManager.retrieveServices(this.id);

//     await BleManager.startNotification(
//       this.id,
//       Scooter.service,
//       Scooter.characteristics.notify,
//     );
//   }

//   // sends lock command, returns promise that resolves when scooter confirms operation
//   async lock() {
//     await this._sendCommand();

//     const confirm = await ScooterDataAnnouncer.waitUntil(this.id, () => true);
//     return confirm;
//   }

//   // sends unlock command, returns promise that resolves when scooter confirms operation
//   async unlock() {
//     await this._sendCommand();

//     const confirm = await ScooterDataAnnouncer.waitUntil(this.id, () => true);
//     return confirm;
//   }

//   // sends GetBattery command, returns promise that resolves to battery percentage as an int between 1-100
//   async getBattery() {}

//   // write to the scooter
//   async _sendCommand(command) {}
// }

// // scans all the ble devices looking for the scooters,
// // returns a promise that resolves to a list of scooters
// export function getAvailableScooters() {
//   const scooters = [];
//   let ScanPromiseResolver = null;

//   const onDiscover = (scooterBLEData) => {
//     scooters.push(new Scooter(scooterBLEData));
//   };

//   const discoverSubscription = _eventEmitter.addListener(
//     'BleManagerDiscoverPeripheral',
//     onDiscover,
//   );

//   const onStopScan = () => {
//     discoverSubscription.remove();
//     stopScanSubscription.remove();
//     console.log('will resolve');
//     ScanPromiseResolver(scooters);
//   };

//   const stopScanSubscription = _eventEmitter.addListener(
//     'BleManagerStopScan',
//     onStopScan,
//   );
//   const ScanPromise = new Promise((resolve) => {
//     ScanPromiseResolver = resolve;
//   });

//    console.log('will return');
//   return BleManager.scan([Scooter.service], 10, false).then(() => ScanPromise);
// }

function parseForBattery(hexdata) {
  const c = hexdata;
  return c;
}

function makeMessageForBattery() {
  const msg = [];
  // fixed prefix (0x55 0xAA)
  msg.push(0x55);
  msg.push(0xaa);
  // L = Data amount + 2
  msg.push(0x02 + 2);
  // D = direction (0x22 = battery to master)
  msg.push(0x22);
  // T = type (0x01 = read)
  msg.push(0x01);
  // c = position, from where to read the data (see table, )
  msg.push(0x32);
  // payload (read 1 bytes);
  msg.push(0x02);

  let sum = msg.slice(2).reduce((acc, curr) => acc + curr);
  const checksum = sum ^ 0xffff;

  // ck0 = checksum's lest significant bit
  msg.push(checksum & 0xff);
  // ck1 = checksum's most significant bit
  msg.push(checksum >> 8);

  return msg;
}

function makeMessageForLock() {
  return [90, -91, 1, 62, 32, 3, 112, 1, 44, -1];
}

function makeMessageForUnlock() {
  return [90, -91, 1, 62, 32, 3, 113, 1, 43, -1];
}

export {
  parseForBattery,
  makeMessageForBattery,
  makeMessageForLock,
  makeMessageForUnlock,
  Scooter,
};
