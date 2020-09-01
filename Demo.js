import React, {useState} from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  Text,
  Button,
  FlatList,
} from 'react-native';

import ScooterLib from './Scooter/index.ts';

const styles = StyleSheet.create({
  pad: {
    padding: 10,
  },
  containerCenter: {
    marginTop: 15,
    textAlign: 'center',
  },
  header: {
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
  },
  row: {
    margin: 10,
    padding: 10,
    backgroundColor: '#bdc3c7',
  },
  bold: {
    fontWeight: 'bold',
  },
  name: {fontWeight: 'bold', textAlign: 'center'},
  signal: {fontSize: 12, textAlign: 'center'},
  battery: {fontSize: 12, textAlign: 'center'},
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

const ScooterListItem = ({scooter, onPress}) => (
  <View style={styles.row}>
    <Pressable onPress={() => onPress(scooter.id)}>
      <Text style={styles.bold}>{scooter.peripheralData.name}</Text>
    </Pressable>
  </View>
);

const getList = (data, onSelect) => (
  <View style={styles.containerCenter}>
    <Text style={styles.header}>Scooters</Text>
    <FlatList
      data={data}
      keyExtractor={(i) => i.id}
      renderItem={({item}) => (
        <ScooterListItem scooter={item} onPress={onSelect} />
      )}
    />
  </View>
);

const getDetail = (scooter) => (
  <View style={styles.containerCenter}>
    <Text style={styles.name}>{scooter.name}</Text>
    <Text style={styles.signal}>Signal (RSSI): {(Math.abs(scooter.signal) / 120 * 100).toFixed(1)}%</Text>
    <Text style={styles.battery}>
      Battery: <Text style={styles.bold}>{scooter.battery}%</Text>
    </Text>
    <View style={styles.buttons}>
      <Button title="Lock" onPress={() => scooter.lock().toPromise()} />
      <Button title="Unlock" onPress={() => scooter.unlock().toPromise()} />
    </View>
  </View>
);

const App = () => {
  const [state, setState] = useState({
    show: 'list',
    selectedScooter: null,
    scooters: {},
    booted: false,
  });

  const [signalSubscription, setSubscription] = useState(null);

  const watchScooterSignal = (scooter = state.selectedScooter) => {
    if(scooter) {
      const observer = {
        next: (value) => {
          newSignalScooter = scooter;
          newSignalScooter.signal = value;
          setState({...state, show: 'detail', selectedScooter: newSignalScooter})
        },
        complete: () => {
          setSubscription(null);
        }
      };

      const subscription = scooter.watchSignal()
        .subscribe(observer);
      setSubscription(subscription);
    }

  }

  const selectScooter = (scooterId) => {
    const scooter = state.scooters[scooterId];
    console.log('selected scooter is', scooterId, scooter);
    scooter
      .connect()
      .toPromise()
      .then(() => {
        setState({
          ...state,
          show: 'detail',
          selectedScooter: scooter,
        });

        watchScooterSignal(scooter);
      })
      .catch((err) => console.log('caught err', err, err.stack));

  };

  

  const scanScooters = () => {
    console.log('scanning')
    ScooterLib.searchScooters().subscribe((scooter) => {
      const scooterList = state.scooters;

      if (scooterList[scooter.id] === undefined) {
        console.log('it does not have');
        scooterList[scooter.id] = scooter;
        setState({...state, scooters: scooterList, show: 'list'});
      }
    });
  };

  const disconnectCurrentScooter = () => {
    state.selectedScooter
      .disconnect()
      .toPromise()
      .then(() => {
        signalSubscription.unsubscribe();
        setState({...state, selectedScooter: null, show: 'list'});
      });
  };

  const getViewByState = (show) => {
    console.log('state is', (state), signalSubscription);
    if (show === 'list') {
      return getList(Object.values(state.scooters), selectScooter);
    }
    if (show === 'detail') {
      return getDetail(state.selectedScooter);
    }
    return <></>;
  };

  const getHeaderButtonByState = (show) => {
    if (show === 'list') {
      return <Button onPress={scanScooters} title="Scan" color="#2c3e50" />;
    }
    if (show === 'detail') {
      return (
        <Button
          onPress={disconnectCurrentScooter}
          title="Disconnect"
          color="#2c3e50"
        />
      );
    }
    return <></>;
  };

  if (!state.booted) {
    //boot bleManager, ask for permissions, then set booted as true;
    ScooterLib.boot();
    setState({...state, booted: true});
  }

  return (
    <View style={styles.pad}>
      {getHeaderButtonByState(state.show)}
      {getViewByState(state.show)}
    </View>
  );
};

export default App;
