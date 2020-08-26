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
import {
  Scooter,
  makeMessageForLock,
  makeMessageForUnlock,
  makeMessageForBattery,
} from './ScooterServices';
import ScooterLib from './Scooter';

const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      scanning: false,
      // peripherals: new Map(),
      scooters: new Map(),
      connectedScooter: null,
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
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    // BleManager.start({showAlert: false}).then(
    //   () => console.log('started'),
    //   () => console.log('err'),
    // );

    ScooterLib.boot().then(
      () => console.log('Booted'),
      () => console.log('error booting'),
    );

    // this.handlerDiscover = bleManagerEmitter.addListener(
    //   'BleManagerDiscoverPeripheral',
    //   this.handleDiscoverPeripheral,
    // );
    // this.handlerStop = bleManagerEmitter.addListener(
    //   'BleManagerStopScan',
    //   this.handleStopScan,
    // );
    // this.handlerDisconnect = bleManagerEmitter.addListener(
    //   'BleManagerDisconnectPeripheral',
    //   this.handleDisconnectedPeripheral,
    // );
    // this.handlerUpdate = bleManagerEmitter.addListener(
    //   'BleManagerDidUpdateValueForCharacteristic',
    //   this.handleUpdateValueForCharacteristic,
    // );

    if (Platform.OS === 'android') {
      BleManager.enableBluetooth().then(
        () => console.log('bluetooth is enabled'),
        () => console.log('bluetooth not enabled'),
      );
    }

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
      });
    }
    this.setState({appState: nextAppState});
  }

  componentWillUnmount() {
    // this.handlerDiscover.remove();
    // this.handlerStop.remove();
    // this.handlerDisconnect.remove();
    // this.handlerUpdate.remove();
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
    const onScooterDiscover = (scooter) => {
      const scooterList = this.state.scooters;

      if (!scooterList.has(scooter.id)) {
        scooterList.set(scooter.id, scooter);
        this.setState({scooters: scooterList});
      }
    };

    const onScanComplete = () => this.setState({scanning: false});

    this.setState({scanning: true});
    ScooterLib.searchScooters(10).subscribe(
      onScooterDiscover,
      () => {},
      onScanComplete,
    );
  }

  retrieveConnected() {
    ScooterLib.getConnected().subscribe((connectedScooters) => {
      const scooterList = this.state.scooters;
      connectedScooters.forEach((cs) => {
        scooterList.set(cs.id, cs);
      });
      this.setState({scooters: scooterList});
    });
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

  async test(scooter) {
    //connect
    if (scooter.isConnected) {
      await scooter.disconnect().toPromise();
      return;
    }

    await scooter.connect().toPromise();
    this.setState({connectedScooter: scooter});

    console.log('asking for battery');
    scooter.getBattery().subscribe((data) => {
      console.log('Got Battery!');
      console.log(JSON.stringify(data));
    });

    console.log('watching rssi for 10 seconds, then unsubscribing');
    const subscription = scooter.watchSignal(2000).subscribe((signal) => {
      console.log('got signal ' + signal);
    });

    setTimeout(() => {
      console.log('unsubscribing...');
      subscription.unsubscribe();
    }, 10000);
  }

  renderItem(item) {
    const color = item.isConnected ? 'green' : '#fff';
    return (
      <TouchableHighlight onPress={() => this.test(item)}>
        <View style={[styles.row, {backgroundColor: color}]}>
          <Text
            style={{
              fontSize: 12,
              textAlign: 'center',
              color: '#333333',
              padding: 10,
            }}>
            {item.peripheralData.name || 'no name'}
          </Text>
          <Text
            style={{
              fontSize: 10,
              textAlign: 'center',
              color: '#333333',
              padding: 2,
            }}>
            RSSI: {item.peripheralData.rssi}
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
          <Text
            style={{
              fontSize: 12,
              textAlign: 'center',
              color: '#FFFFFF',
              padding: 2,
              paddingBottom: 20,
            }}>
            Battery Level {item.battery || 'Unknown'}
          </Text>
          {/*  */}
          {/* Button for locking/unlocking */}
        </View>
      </TouchableHighlight>
    );
  }

  setPeripheralConnection(pId, state) {
    const peripherals = this.state.peripherals;
    const p = peripherals.get(pId);
    p.connected = state;
    if (!state) {
      p.subscription = null;
    }
    peripherals.set(pId, p);
    this.setState({peripherals});
  }

  render() {
    const list = Array.from(this.state.scooters.values());
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
