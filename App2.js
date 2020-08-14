import React, { useState, useEffect } from 'react';
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
  SafeAreaView
} from 'react-native';
import BleManager from 'react-native-ble-manager';

const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);


const App = () => {

  let handlerDiscover, handlerStop, handlerDisconnect, handlerUpdate
  const [state, setState] = useState({
    scanning:false,
      peripherals: new Map(),
      appState: ''
  });
  useEffect(() => {
    // Actualiza la informacion del usuario
    start();
    return (
      () => {
        handlerDiscover.remove();
        handlerStop.remove();
        handlerDisconnect.remove();
        handlerUpdate.remove();
      }
    )
  }, []);

 

  const start = () => {
    AppState.addEventListener('change', handleAppStateChange());

    BleManager.start({showAlert: false});

    handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral() );
    handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan() );
    handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral() );
    handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic() );



    if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
            if (result) {
              console.log("Permission is OK");
            } else {
              PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                if (result) {
                  console.log("User accept");
                } else {
                  console.log("User refuse");
                }
              });
            }
      });
    }

  }

  const handleAppStateChange = (nextAppState) => {
    if (state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
        console.log(JSON.stringify(state))
        console.log(JSON.stringify(state.peripherals))
      });
    }
    setState({appState: nextAppState});
  }

  const handleDisconnectedPeripheral = (data) => {
    let peripherals = state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setState({peripherals});
    }
    console.log('Disconnected from ' + data.peripheral);
  }

 const handleUpdateValueForCharacteristic = (data) => {
    console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
  }

  const handleStopScan = () => {
    console.log('Scan is stopped');
    setState({ scanning: false });
  }

  const startScan = () => {
    console.log(state)
    if (!state.scanning) {
      //setState({peripherals: new Map()});
      BleManager.scan([], 3, true).then((results) => {
        console.log('Scanning...');
        setState({scanning:true});
      });
    }
  }

  const retrieveConnected = () => {
    BleManager.getConnectedPeripherals([]).then((results) => {
      if (results.length == 0) {
        console.log('No connected peripherals')
      }
      console.log(results);
      var peripherals = state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        console.log(peripheral)
        setState({ peripherals });
      }
    });
  }

  const getRssi = () => {
    console.log(JSON.stringify(state.peripherals) )
    console.log('state')
    BleManager.readRSSI("D1:A8:C2:24:19:8E")
    .then((rssi) => {
      // Success code
      console.log("Current RSSI: " + rssi);
    })
    .catch((error) => {
      // Failure code
      console.log(error);
    });
  }

  const getServices = () => {
    console.log(JSON.stringify(state) )
    console.log('state')


    BleManager.retrieveServices("D1:A8:C2:24:19:8E").then(
      (peripheralInfo) => {
        // Success code
        console.log("Peripheral info:", peripheralInfo);
      }
    );
  }

  const tryFunction = () => {
    BleManager.read(
      "D1:A8:C2:24:19:8E",
      "fe95",
      "0004"
    )
      .then((readData) => {
        // Success code
        console.log("Read: " + readData);
    
        const buffer = Buffer.Buffer.from(readData); //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
        const sensorData = buffer.readUInt8(1, true);
      })
      .catch((error) => {
        // Failure code
        console.log(error);
      });
  }

  const handleDiscoverPeripheral = (peripheral) => {
    var peripherals = state.peripherals;
    console.log('Got ble peripheral', peripheral);
    // if (!peripheral?.name) {
    //   peripheral?.name = 'NO NAME';
    // }
    peripherals.set(peripheral.id, peripheral);
    setState({ peripherals });
  }

  const test = (peripheral) => {
    if (peripheral){
      if (peripheral.connected){
        BleManager.disconnect(peripheral.id);
      }else{
        BleManager.connect(peripheral.id).then(() => {
          let peripherals = state.peripherals;
          let p = peripherals.get(peripheral.id);
          if (p) {
            p.connected = true;
            peripherals.set(peripheral.id, p);
            setState({peripherals});
          }
          console.log('Connected to ' + peripheral.id);


          setTimeout(() => {

            /* Test read current RSSI value
            BleManager.retrieveServices(peripheral.id).then((peripheralData) => {
              console.log('Retrieved peripheral services', peripheralData);

              BleManager.readRSSI(peripheral.id).then((rssi) => {
                console.log('Retrieved actual RSSI value', rssi);
              });
            });*/

            // Test using bleno's pizza example
            // https://github.com/sandeepmistry/bleno/tree/master/examples/pizza
            BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
              console.log(JSON.stringify(peripheralInfo));
              var service = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
              var bakeCharacteristic = '0000180f-0000-1000-8000-00805f9b34fb';
              var crustCharacteristic = '13333333-3333-3333-3333-333333330001';

              setTimeout(() => {
                BleManager.startNotification(peripheral.id, service, bakeCharacteristic).then(() => {
                  console.log('Started notification on ' + peripheral.id);
                  setTimeout(() => {
                    BleManager.write(peripheral.id, service, crustCharacteristic, [0]).then(() => {
                      console.log('Writed NORMAL crust');
                      BleManager.write(peripheral.id, service, bakeCharacteristic, [1,95]).then(() => {
                        console.log('Writed 351 temperature, the pizza should be BAKED');
                        /*
                        var PizzaBakeResult = {
                          HALF_BAKED: 0,
                          BAKED:      1,
                          CRISPY:     2,
                          BURNT:      3,
                          ON_FIRE:    4
                        };*/
                      });
                    });

                  }, 500);
                }).catch((error) => {
                  console.log('Notification error', error);
                });
              }, 200);
            });

          }, 900);
        }).catch((error) => {
          console.log('Connection error', error);
        });
      }
    }
  }

  const renderItem = (item) => {
    const color = item.connected ? 'green' : '#fff';
    return (
      <>
      <TouchableHighlight onPress={() => test(item) }>
        <View style={[styles.row, {backgroundColor: color}]}>
          <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
          <Text style={{fontSize: 10, textAlign: 'center', color: '#333333', padding: 2}}>RSSI: {item.rssi}</Text>
          <Text style={{fontSize: 8, textAlign: 'center', color: '#333333', padding: 2, paddingBottom: 20}}>{item.id}</Text>
        </View>
      </TouchableHighlight>
      </>
    );
  }


  const list = Array.from(state.peripherals.values());
  const btnScanTitle = 'Scan Bluetooth (' + (state.scanning ? 'on' : 'off') + ')';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <View style={{margin: 10}}>
            <Button title={btnScanTitle} onPress={() => startScan() } />
          </View>

          <View style={{margin: 10}}>
          <Button title="Retrieve connected peripherals" onPress={() => retrieveConnected() } />
          </View>
          <View style={{margin: 10}}>
            <Button title="getRci" onPress={() => getRssi() } />
          </View>
          <View style={{margin: 10}}>
            <Button title="testtesttest" onPress={() => getServices() } />
          </View>
          <View style={{margin: 10}}>
            <Button title="tryFunction" onPress={() => tryFunction() } />
          </View>

          {/* <ScrollView style={styles.scroll}>
            {(list.length == 0) &&
              <View style={{flex:1, margin: 20}}>
                <Text style={{textAlign: 'center'}}>No peripherals</Text>
              </View>
            }
            <FlatList
              data={list}
              renderItem={({ item }) => renderItem(item) }
              keyExtractor={item => item.id}
            />

          </ScrollView> */}
        </View>
      </SafeAreaView>
    );
}
export default App;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    width: window.width,
    height: window.height
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    margin: 10,
  },
  row: {
    margin: 10
  },
});
