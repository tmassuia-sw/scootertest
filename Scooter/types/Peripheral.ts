export interface PeripheralConnectionOptions {
  id: string;
  service: string;
  characteristic: string;
}

export interface PeripheralWriteOptions {
  id: string;
  payload: number[];
  service: string;
  characteristic: string;
}

/*
value — Array — the read value
peripheral — String — the id of the peripheral
characteristic — String — the UUID of the characteristic
service — String — the UUID of th
*/

export interface PeripheralCharacteristicValueUpdate {
  value: number[];
  peripheral: string;
  characteristic: string;
  service: string;
}