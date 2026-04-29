# homebridge-dahua-gate-release
Homebridge plugin to initiate an eletronic gate/door controlled by a Dahua VTO2111D (VIP INTIPRDSDJ) intercom (Digest Auth). While not tested with other Dahua intercoms, this may still work with other models.
Great for using the Apple Home app or even asking Siri to 'Open the gate!'.
# Homebridge Dahua Gate Release

This plugin adds a virtual switch to HomeKit. Turning it on (or asking Siri) sends `openDoor` CGI command to a Dahua VTO2111D intercom.

## Homebridge install
1. Search for the plugin 'Homebridge Dahua Gate Releaase' and select to install. 

## Configuration

Once installed, go to the plugin config and configure the appropriate details as below.
Restart the plugin
Enable to Child Bridge
Scan the QR in the Home app by adding a new accessory.
Button should now appear within the Home app or you can control via Siri.
NOTE: The gate/door will default to showing a 'Locked' and switch to 'Unlock' temporarily for 20 seconds (default) befoe reverting back to a locked state. You can disabled relocking if necessary.

```json
{
"accessory": "DahuaGateRelease",
"name": "Front Gate",
"ip": "192.168.1.110",
"username": "admin",
"password": "YourPassword",
"pollInterval": 60000
}

## Automation

If you're attempting to automate an unlock or lock of the door/gate, Apple's treatment of security devices like Gates, Garage doors
and Security Systems can be tricky to automate based on geolocation services or remote access. Thus, you'll need to use another virtual/dummy accessory, using
another Homekit plugin such as 'Homebridge Virtual Switches'. 
