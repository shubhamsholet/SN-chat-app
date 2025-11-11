import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shubham.snchatapp',
  appName: 'SN Chat App',
 webDir: 'dist/SN-chat-app/browser', 
   server: {
    androidScheme: 'https'
  },
  plugins:{
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample' ,// Ensure this icon is added in the Android project
      iconColor: '#488AFF'  
  }
}
};

export default config;
