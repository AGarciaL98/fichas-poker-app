import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fichaspoker.app',
  appName: 'FichasPoker',
  webDir: 'dist',
  // When the server moves to the cloud, set CAPACITOR_SERVER_URL and uncomment:
  // server: {
  //   url: process.env.CAPACITOR_SERVER_URL,
  //   cleartext: false,
  // },
}

export default config
