const SERVICES = Object.freeze({ //tan correctos estos?????
  service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  characteristics: {
    notify: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
    read: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  },
});

// cuántos servicios+características tiene? un solo servicio con una caracteristica Notify y otra Write?
// R: si, un solo servicio con una caracteristica Notify y otra Write
// Cuál es el servicio y la característica de notify? hay que hacer una resubscripción cuando manda datos?
// R: Solo una subscripción, se  mantiene la subscripción y se anuncian nuevos datos, mismo principio de los observables
// los bytes de donde viene tiene valores de ida y vuelta "from master to battery & from battery to master" qué significa eso?
// los códigos arrancan siempre con 55 aa
