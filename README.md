<p align="center">
 <a href="https://github.com/netmatrixtech/homebridge-dahua-gate-release"><img alt="Dahua Gate Release" src="/assets/icon-medium.png" width="370px"></a>
</p>
<span align="center">

![npm](https://img.shields.io/npm/v/homebridge-dahua-gate-release)
![npm downloads](https://img.shields.io/npm/dt/homebridge-dahua-gate-release)
![Node.js](https://img.shields.io/badge/node-%3E=18.0.0-green)
![Homebridge](https://img.shields.io/badge/homebridge-%3E=1.6.0-blue)
![License](https://img.shields.io/github/license/netmatrixtech/homebridge-dahua-gate-release)
<span>

# Homebridge Dahua Gate Release (Platform Plugin)

A Homebridge plugin that creates a virtual button to unlock the strike plate lock mechanism connected to a Dahua VTO2111D Intercom.  Other models not tested but may work.
When unlocked (or when you ask Siri to *“Open the gate”*), the plugin sends a Dahua CGI command to open it. 
The plugin adds a virtual switch to HomeKit. Turning it on (or asking Siri) sends `openDoor` CGI command to a Dahua VTO2111D intercom.

## Homebridge install
1. Search for the plugin 'Homebridge Dahua Gate Releaase' and select to install. 

### Prerequisites

- To use this plugin, you will need to already have:
  - [Node](https://nodejs.org): latest version of `v22` or `v24. (26 not tested)
  - [Homebridge](https://homebridge.io): `v1.6` - refer to link for more information and installation instructions.

## Configuration

Once installed, go to the plugin config and configure the appropriate details as below.
Restart the plugin
Enable to Child Bridge
Scan the QR in the Home app by adding a new accessory.
Button should now appear within the Home app or you can control via Siri.
NOTE: The gate/door will default to showing a 'Locked' and switch to 'Unlock' temporarily for 20 seconds (default) before reverting back to a locked state. You can disabled relocking if necessary.

```json
{
"accessory": "DahuaGateRelease",
"name": "Front Gate",
"accessoryName": "Front Gate"
"ip": "192.168.1.110",
"username": "admin",
"password": "YourPassword",
"pollInterval": 60000
}

## Automation

If you're attempting to automate an unlock or lock of the door/gate, Apple's treatment of security devices like Gates, Garage doors
and Security Systems can be tricky to automate based on geolocation services or remote access. Thus, you'll need to use another virtual/dummy accessory, using
another Homekit plugin such as 'Homebridge Virtual Switches'. 



Designed for the **Dahua VTO2111D** intercom, but compatible with many Dahua VTO and rebranded models using Digest Authentication.

---

## ✨ Features

- Unlock your gate using **Siri**, **Apple Home**, or **Automations**
- Uses **Digest Auth** for secure communication
- Automatic **re-lock** after a configurable delay
- Retry logic with configurable attempts + delay
- Polling to detect intercom availability
- Full support for **Child Bridge** mode
- Clean shutdown with safe timers (Node 18–26 compatible)

---

## 📦 Installation

1. Open **Homebridge UI**  
2. Go to **Plugins**  
3. Search for **“Homebridge Dahua Gate Release”**  
4. Install the plugin  
5. Restart Homebridge

---

## ⚙️ Configuration

After installation:

1. Open the plugin settings  
2. Enter your Dahua intercom details  
3. Enable **Child Bridge** (recommended)  
4. Save & restart Homebridge  
5. Scan the QR code in the Home app to add the accessory

### Example configuration

```json
{
  "platform": "DahuaGateRelease",
  "name": "Front Gate",
  "ip": "192.168.1.110",
  "username": "admin",
  "password": "YourPassword",
  "fallbackRetries": 1,
  "fallbackDelay": 5000,
  "autoLockTime": 20,
  "autoLockUnit": "seconds",
  "pollInterval": 60000,
  "verboseLogging": false
}

### Disclaimer

- I have created this plugin in my own time free for you to use.
- I have no affiliation with Dahua or any company rebanding Dahua devices.
- Use this plugin at your own risk.
- You are licensed to use this plugin free of charge but within the limited of the license distributed with this plugin.