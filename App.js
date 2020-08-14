import React, {Component} from 'react';
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
import BleManager from 'react-native-ble-manager';
import {stringToBytes} from 'convert-string';

const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      scanning: false,
      peripherals: new Map(),
      appState: '',
    };

    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(
      this,
    );
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(
      this,
    );
    this.testestConnected = this.getRssi.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
    this.testtesttest = this.getServices.bind(this);
    this.tryFunction = this.write.bind(this);
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    BleManager.start({showAlert: true});

    this.handlerDiscover = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      this.handleDiscoverPeripheral,
    );
    this.handlerStop = bleManagerEmitter.addListener(
      'BleManagerStopScan',
      this.handleStopScan,
    );
    this.handlerDisconnect = bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      this.handleDisconnectedPeripheral,
    );
    this.handlerUpdate = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      this.handleUpdateValueForCharacteristic,
    );

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ).then((result) => {
        if (result) {
          console.log('Permission is OK');
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          ).then((result) => {
            if (result) {
              console.log('User accept');
            } else {
              console.log('User refuse');
            }
          });
        }
      });
    }
  }

  handleAppStateChange(nextAppState) {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('App has come to the foreground!');
      BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
        console.log(JSON.stringify(this.state));
        console.log(JSON.stringify(this.state.peripherals));
      });
    }
    this.setState({appState: nextAppState});
  }

  componentWillUnmount() {
    this.handlerDiscover.remove();
    this.handlerStop.remove();
    this.handlerDisconnect.remove();
    this.handlerUpdate.remove();
  }

  handleDisconnectedPeripheral(data) {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({peripherals});
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  handleUpdateValueForCharacteristic(data) {
    console.log(
      'Received data from ' +
        data.peripheral +
        ' characteristic ' +
        data.characteristic,
      data.value,
    );
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({scanning: false});
  }

  startScan() {
    console.log(this.state);
    if (!this.state.scanning) {
      //this.setState({peripherals: new Map()});
      BleManager.scan([], 3, true).then((results) => {
        console.log('Scanning...');
        this.setState({scanning: true});
      });
    }
  }

  retrieveConnected() {
    BleManager.getConnectedPeripherals([]).then((results) => {
      if (results.length == 0) {
        console.log('No connected peripherals');
      }
      console.log(results);
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        console.log(peripheral);
        this.setState({peripherals});
      }
    });
  }

  getRssi() {
    console.log(JSON.stringify(this.state));
    console.log('this.state');
    BleManager.readRSSI('E3:4C:13:08:FD:2E')
      .then((rssi) => {
        // Success code
        console.log('Current RSSI: ' + rssi);
      })
      .catch((error) => {
        // Failure code
        console.log(error);
      });
  }
  getServices() {
    console.log(JSON.stringify(this.state));
    console.log('this.state');

    BleManager.retrieveServices('D1:A8:C2:24:19:8E').then((peripheralInfo) => {
      // Success code
      console.log('Peripheral info:', peripheralInfo);
    });
  }

  write() {
    const data = stringToBytes('55aa032201b50222ff');
    console.log(data);
    BleManager.write(
      'D1:A8:C2:24:19:8E',
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
      '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
      data,
    )
      .then((readData) => {
        // Success code
        JSON.stringify(readData);
        console.log('Read: ' + readData);

        //  const buffer = Buffer.Buffer.from(readData); //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
        //  const sensorData = buffer.readUInt8(1, true);
      })
      .catch((error) => {
        // Failure code
        console.log('error');
        console.log(error);
      });

    // BleManager.startNotification(
    //   'E3:4C:13:08:FD:2E',
    //   '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
    //   '0001',
    // )
    //   .then(() => {
    //     // Success code
    //     console.log('Notification started');
    //   })
    //   .catch((error) => {
    //     // Failure code
    //     console.log(error);
    //   });
  }

  handleDiscoverPeripheral(peripheral) {
    var peripherals = this.state.peripherals;
    console.log('Got ble peripheral', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
    peripherals.set(peripheral.id, peripheral);
    this.setState({peripherals});
  }

  test(peripheral) {
    if (peripheral) {
      if (peripheral.connected) {
        BleManager.disconnect(peripheral.id);
      } else {
        BleManager.connect(peripheral.id)
          .then(() => {
            let peripherals = this.state.peripherals;
            let p = peripherals.get(peripheral.id);
            if (p) {
              p.connected = true;
              peripherals.set(peripheral.id, p);
              this.setState({peripherals});
            }
            console.log('Connected to ' + peripheral.id);

            setTimeout(() => {
              const data = stringToBytes('55aa032001b50222ff');

              /* Test read current RSSI value
            BleManager.retrieveServices(peripheral.id).then((peripheralData) => {
              console.log('Retrieved peripheral services', peripheralData);

              BleManager.readRSSI(peripheral.id).then((rssi) => {
                console.log('Retrieved actual RSSI value', rssi);
              });
            });*/

              // Test using bleno's pizza example
              // https://github.com/sandeepmistry/bleno/tree/master/examples/pizza
              BleManager.retrieveServices(peripheral.id).then(
                (peripheralInfo) => {
                  console.log(JSON.stringify(peripheralInfo));
                  var service = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
                  var bakeCharacteristic =
                    '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
                  var crustCharacteristic =
                    '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

                  const data = stringToBytes('55aa032001b70420ff');
                  console.log(data);
                  // BleManager.write(
                  //   'D1:A8:C2:24:19:8E',
                  //   '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
                  //   '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
                  //   data
                  // )
                  setTimeout(() => {
                    BleManager.startNotification(
                      peripheral.id,
                      service,
                      bakeCharacteristic,
                    )
                      .then((e) => {
                        console.log(e)
                        console.log('Started notification on ' + peripheral.id);
                        setTimeout(() => {
                          BleManager.write(
                            peripheral.id,
                            service,
                            crustCharacteristic,
                            data,
                          ).then((e) => {
                            console.log(e);
                            console.log('Writed NORMAL crust');
                            BleManager.write(
                              peripheral.id,
                              service,
                              crustCharacteristic,
                              data,
                            ).then((e) => {
                              console.log(e);

                              console.log(
                                'Writed 351 temperature, the pizza should be BAKED',
                              );
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
                      })
                      .catch((error) => {
                        console.log('Notification error', error);
                      });
                  }, 200);
                },
              );
            }, 900);
          })
          .catch((error) => {
            console.log('Connection error', error);
          });
      }
    }
  }

  renderItem(item) {
    const color = item.connected ? 'green' : '#fff';
    return (
      <>
        <TouchableHighlight onPress={() => this.test(item)}>
          <View style={[styles.row, {backgroundColor: color}]}>
            <Text
              style={{
                fontSize: 12,
                textAlign: 'center',
                color: '#333333',
                padding: 10,
              }}>
              {item.name}
            </Text>
            <Text
              style={{
                fontSize: 10,
                textAlign: 'center',
                color: '#333333',
                padding: 2,
              }}>
              RSSI: {item.rssi}
            </Text>
            <Text
              style={{
                fontSize: 8,
                textAlign: 'center',
                color: '#333333',
                padding: 2,
                paddingBottom: 20,
              }}>
              {item.id}
            </Text>
          </View>
        </TouchableHighlight>
      </>
    );
  }

  render() {
    const list = Array.from(this.state.peripherals.values());
    const btnScanTitle =
      'Scan Bluetooth (' + (this.state.scanning ? 'on' : 'off') + ')';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <View style={{margin: 10}}>
            <Button title={btnScanTitle} onPress={() => this.startScan()} />
          </View>

          <View style={{margin: 10}}>
            <Button
              title="Retrieve connected peripherals"
              onPress={() => this.retrieveConnected()}
            />
          </View>
          <View style={{margin: 10}}>
            <Button title="getRci" onPress={() => this.getRssi()} />
          </View>
          <View style={{margin: 10}}>
            <Button title="get services" onPress={() => this.getServices()} />
          </View>
          <View style={{margin: 10}}>
            <Button title="write" onPress={() => this.write()} />
          </View>

          <ScrollView style={styles.scroll}>
            {list.length == 0 && (
              <View style={{flex: 1, margin: 20}}>
                <Text style={{textAlign: 'center'}}>No peripherals</Text>
              </View>
            )}
            <FlatList
              data={list}
              renderItem={({item}) => this.renderItem(item)}
              keyExtractor={(item) => item.id}
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
}

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
