# homebridge-dahua-gate-release
Homebridge plugin to release eletronic gate/door controlled by a Dahua VTO2111D (VIP INTIPRDSDJ) intercom (Digest Auth). While not tested with other Dahua intercoms, this may still work with other models.

# Homebridge Dahua Gate Release

This plugin adds a virtual switch to HomeKit. Turning it on (or asking Siri) sends `openDoor` CGI command to a Dahua VTO2111D intercom.

## Manaul Installation

1. Open Homebridge terminal and navigate to Nodes_Modules
2. Create a new direcotry called 'homebridge-dahua-gate-release' and copy **all** files repo files into the direcotry. This may require using nano to manaually create files and paste code.
3. From within the 'homebridge-dahua-gate-release' direcotry, run:   npm install
4. Restart Homebridge.

## Homebridge install
1. Search for the plugin and select to install automatically.

## Configuration

Once installed, go to the plugin config and configure the appropriate details as below.
Restart the plugin
Enable to Child Bridge
Scan the QR in the Home app by adding a new accessory.
Button should now appear within the Home app or you can control via Siri.
NOTE: The gate will default to showing a 'Locked' and switch to 'Unlock' temporarily for 20 seconds once you request to unlock the gate.

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

If you're attempting to automate an unlock or lock of the door/gate, Apple's treatment of security devies like Gztes, Garage doors
and Security Systems can be tricky to automate. Thus, you'll need to use another virtual/dummy accessory, using
another plugin such as 'Virtual Switches for Homebridge'. However, it's important to note that setting a generic switch or lock
can still make Siri ask you to unlock your iPhone before it will run the access.
