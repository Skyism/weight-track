import { requireOptionalNativeModule } from 'expo-modules-core';

interface WidgetBridgeNative {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  reloadWidgets(): void;
}

// Optional: absent in Expo Go / web / before prebuild. All callers guard on this.
const native = requireOptionalNativeModule<WidgetBridgeNative>('WidgetBridge');

export const isWidgetBridgeAvailable = native != null;

export function setItem(key: string, value: string): void {
  native?.setItem(key, value);
}

export function getItem(key: string): string | null {
  return native?.getItem(key) ?? null;
}

export function reloadWidgets(): void {
  native?.reloadWidgets();
}
