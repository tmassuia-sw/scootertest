interface ScooterCharacteristics {
  readonly notify: string;
  readonly write: string;
}

export default interface ScooterResources {
  readonly service: string;
  readonly characteristics: ScooterCharacteristics
}
