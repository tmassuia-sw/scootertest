/* eslint-disable no-bitwise */

const Scooter = Object.freeze({
  service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  characteristics: {
    notify: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
    write: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  },
});

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
