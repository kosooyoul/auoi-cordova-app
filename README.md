# Auoi Cordova App

## Prepare
* Download "google-services.json" from Firebase ( https://console.firebase.google.com )
* and Add json file into this project root directory

## Setup
```
npm -g install cordova
```

## Build for Android
```
cordova platform add android
cordova requirements android
cordova build android --verbose
cordova run android
```

## Build for IOS
App name must be english and has no space, in config.xml
```
cordova platform add ios
cordova requirements ios
cordova build ios --verbose
cordova run ios
```
IOS Project is in platforms/ios
If pod error occured, follow commands
```
# Delete pod packages
cd platform/ios
rm -rf Pods
rm -rf Podfile.lock

# Reinstall
pod update
pod repo update
pod install
```
If target version error occured, open the finder,
and then Run platform/ios/{my-project-name}.xcworkspace
And, in General tab, chagne minimum deployments options.

## ref Guide
* Platform Guide : https://cordova.apache.org/docs/en/11.x/guide/platforms/android/
* App Icon : https://cordova.apache.org/docs/en/11.x/config_ref/images.html
* Config Preferences : https://cordova.apache.org/docs/en/11.x/config_ref/
* File Read & Write : https://cordova.apache.org/docs/en/11.x/reference/cordova-plugin-file/
