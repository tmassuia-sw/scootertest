/**
 * @format
 */

import {AppRegistry} from 'react-native';
// import App from 'react-native-ble-manager/example/App';
import App from './App';


import App3 from './App3';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);

// try with react-native-ble-plx
//AppRegistry.registerComponent(appName, () => App3);
