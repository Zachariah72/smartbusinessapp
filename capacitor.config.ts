import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bizinsightsafrica.app',
  appName: 'Biz Insights Africa',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
