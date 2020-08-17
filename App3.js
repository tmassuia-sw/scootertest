import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ScrollView,
  AppState,
  FlatList,
  Dimensions,
  Button,
  SafeAreaView,
} from 'react-native';
import Base64 from './Base64';
import {stringToBytes} from 'convert-string';

import {BleManager} from 'react-native-ble-plx';

const window = Dimensions.get('window');

const App = () => {
  const [state, setState] = useState({
    scanning: false,
    device: [],
    appState: '',
  });
  const manager = new BleManager();
  console.log(manager);

  const service = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  const readCharacteristic = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
  const writeCharacteristic = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

  const data = Base64.btoa('55aa032001b50422ff');

  const subscription = manager.onStateChange((state) => {
    console.log(state);

    console.log('wwww');
    if (state === 'PoweredOn') {
      scanAndConnect();
      subscription.remove();
    }
  }, true);

  const scanAndConnect = () => {
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        // Handle error (scanning will be stopped automatically)
        return;
      }
      setState({...state, device: device});
      console.log(state);
      console.log(device.id);
      // Check if it is a device you are looking for based on advertisement data
      // or other criteria.
      if (device.name === 'TI BLE Sensor Tag' || device.name === 'SensorTag') {
        // Stop scanning as it's not necessary if you are scanning for one device.
        manager.stopDeviceScan();

        // Proceed with connection.
      }
    });
  };

  const connectDevice = (device) => {
    device
      .connect()
      .then((device) => {
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        console.log('device');
        console.log(device);
        // Do work on device with services and characteristics
      })
      .catch((error) => {
        console.log(error);
        // Handle errors
      });
  };

  //   let handlerDiscover, handlerStop, handlerDisconnect, handlerUpdate
  useEffect(() => {
    // Actualiza la informacion del usuario
    //subscription;
    // return (
    //   () => {
    //     handlerDiscover.remove();
    //     handlerStop.remove();
    //     handlerDisconnect.remove();
    //     handlerUpdate.remove();
    //   }
    // )
  }, []);
  console.log(state);
  //   const list = Array.from(state.peripherals.values());
  const btnScanTitle =
    'Scan Bluetooth (' + (state.scanning ? 'on' : 'off') + ')';

  const handleWrite = async () => {
    console.log(manager);
    try {
      const tryWrite = await manager.writeCharacteristicWithResponseForDevice(
        state.device.id,
        service,
        writeCharacteristic,
        data,
      );
      console.log('tryWrite');
      console.log(tryWrite);
    } catch (error) {
      console.log(error);
    }
  };
  //   const handleWrite = () => {
  //     manager.writeCharacteristicWithResponseForDevice(
  //         state.device.id,
  //         service,
  //         writeCharacteristic,
  //         'NTVhYTAzMjAwMWI3MDQyMGZm',
  //       )
  //       .then((response) => {
  //         console.log('response');
  //         console.log(response);
  //       })
  //       .then((device) => {
  //         console.log('device');
  //         console.log(device);
  //       })
  //       .catch((error) => {
  //         console.log('error');
  //         console.log(error);
  //         // Handle errors
  //       });
  //   };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View style={{margin: 10}}>
          <Button title={btnScanTitle} onPress={() => scanAndConnect()} />
        </View>

        <View style={{margin: 10}}>
          <Button
            title="stopDeviceScan()"
            onPress={() => manager.stopDeviceScan()}
          />
        </View>
        <View style={{margin: 10}}>
          <Button
            title="cancelDeviceConnection()"
            onPress={() => manager.cancelDeviceConnection()}
          />
        </View>
        <View style={{margin: 10}}>
          <Button title="try write()" onPress={() => handleWrite()} />
        </View>

        <ScrollView style={styles.scroll}>
          <TouchableHighlight onPress={() => connectDevice(state.device)}>
            <View style={[styles.row]}>
              <Text
                style={{
                  fontSize: 12,
                  textAlign: 'center',
                  color: '#333333',
                  padding: 10,
                }}>
                {state.device.name}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  textAlign: 'center',
                  color: '#333333',
                  padding: 2,
                }}>
                RSSI: {state.device.rssi}
              </Text>
              <Text
                style={{
                  fontSize: 8,
                  textAlign: 'center',
                  color: '#333333',
                  padding: 2,
                  paddingBottom: 20,
                }}>
                {state.device.id}
              </Text>
            </View>
          </TouchableHighlight>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};
export default App;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    width: window.width,
    height: window.height,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    margin: 10,
  },
  row: {
    margin: 10,
  },
});
