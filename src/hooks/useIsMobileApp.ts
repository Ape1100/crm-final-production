import { Capacitor } from '@capacitor/core';

export function useIsMobileApp() {
  return Capacitor.isNativePlatform();
} 