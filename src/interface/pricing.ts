export interface PriceSettingValue {
  isEnable: boolean;
  value: number;
}

export interface PriceSettings {
  deliveryFee: PriceSettingValue;
  vat: PriceSettingValue;
}
