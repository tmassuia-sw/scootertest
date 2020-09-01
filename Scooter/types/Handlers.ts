import { EmitterSubscription } from 'react-native';
import { Peripheral } from 'react-native-ble-manager';

export type DiscoverHandler = (x: Peripheral) => void

export type NoParamsHandler = () => void

export interface BleManagerEventHandlers {
  discover?: EmitterSubscription;
  stopScan?: EmitterSubscription;
}
