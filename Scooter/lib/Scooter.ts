import { Peripheral } from "react-native-ble-manager";
import { Observable, Subscriber, concat, from as ObservableFrom } from 'rxjs';
import { take, map, delay } from 'rxjs/operators';
import Manager from './bluetooth/Manager';
import ScooterResources from './enums/ScooterResources';

export default class Scooter {
  public peripheralData: Peripheral;
  public isConnected: boolean;
  public battery: number;
  public signal: number;

  constructor(data: Peripheral, connected: boolean = false) {
    this.peripheralData = data;
    this.isConnected = connected;
    this.battery = 0;
    this.signal = 1;
  }

  get name(): string | undefined {
    return this.peripheralData.name;
  }

  get id(): string {
    return this.peripheralData.id;
  }

  private _boot(): Promise<void> {
    return Manager.connectAndNotify({
      id: this.peripheralData.id,
      service: ScooterResources.service,
      characteristic: ScooterResources.characteristics.notify
    });
  }

  private _teardown(): Promise<void> {
    return Manager.stopNotifyAndDisconnect({
      id: this.peripheralData.id,
      service: ScooterResources.service,
      characteristic: ScooterResources.characteristics.notify
    });
  }

  connect(): Observable<void> {
    this.isConnected = true;
    const bootPromise = this._boot()
    .then(() => this.getBattery().pipe(take(1)).toPromise())
    .then((battery: number) => {
      this.battery = battery;
      this.signal = this.peripheralData.rssi;
    })
    .catch(() => {
      this.isConnected = false;
    })

    return ObservableFrom(bootPromise).pipe(take(1));

  }

  disconnect(): Observable<void> {
    const teardownPromise = this._teardown().then(() => {
      this.isConnected = false;
    });

    return ObservableFrom(teardownPromise);
  }

  lock(): Observable<void> {
    if (!this.isConnected) {
      throw new Error('Scooter not connected');
    }

    //TODO: implement NbMessage lib to replace hardcoded payloads
    const payload: number[] = [
      90, -91, 1, 62, 32, 3, 112, 1, 44, -1
    ];

    return ObservableFrom(Manager.write({
      id: this.peripheralData.id,
      service: ScooterResources.service,
      characteristic: ScooterResources.characteristics.write,
      payload,
    }));
    
  }

  unlock(): Observable<void> {
    if (!this.isConnected) {
      throw new Error('Scooter not connected');
    }

    //TODO: implement NbMessage lib to replace hardcoded payloads
    const payload: number[] = [
      90, -91, 1, 62, 32, 3, 113, 1, 43, -1
    ];

    return ObservableFrom(Manager.write({
      id: this.peripheralData.id,
      service: ScooterResources.service,
      characteristic: ScooterResources.characteristics.write,
      payload,
    }));
  }

  getBattery(): Observable<number> {
    if (!this.isConnected) {
      throw new Error('Scooter not connected');
    }

    //TODO: implement NbMessage lib to replace hardcoded payloads
    const payload: number[] = [
      90, -91, 1, 62, 34, 1, 50, 2, 105, -1
    ];

    // todo: pass parameter
    return Manager
      .writeWithNotificationResponse({
        id: this.peripheralData.id,
        service: ScooterResources.service,
        characteristic: ScooterResources.characteristics.write,
        payload,
      })
      .pipe(
        take(1),
        map((v: string[])=> parseInt(v[8] + v[7], 16))
      );
  }

  watchSignal(time: number = 2000): Observable<number> {
    return new Observable((subscriber: Subscriber<number>) => {
      let id = setInterval(() => {
        Manager.getSignal(this.id).then((rssi) => {
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
