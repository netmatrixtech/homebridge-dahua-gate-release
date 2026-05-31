<p align="center">
<a href="https://github.com/netmatrixtech/homebridge-dahua-gate-release"><img alt="Dahua Gate Release" src="https://raw.githubusercontent.com/netmatrixtech/homebridge-dahua-gate-release/main/assets/icon-small-medium.png?sanitize=true" width="290px"></a>


[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
![npm](https://img.shields.io/npm/v/homebridge-dahua-gate-release)
![npm downloads](https://img.shields.io/npm/dt/homebridge-dahua-gate-release)
![Node.js](https://img.shields.io/badge/node-%3E=18.0.0-green)
![Homebridge](https://img.shields.io/badge/homebridge-%3E=1.6.0-blue)
![License](https://img.shields.io/github/license/netmatrixtech/homebridge-dahua-gate-release)
[![GitHub last commit](https://img.shields.io/github/last-commit/netmatrixtech/homebridge-dahua-gate-release)](https://github.com/netmatrixtech/homebridge-dahua-gate-release)
</p>


# Homebridge Dahua Gate Release

A Homebridge plugin that creates a virtual button to unlock an strike plate lock mechanism connected to a Dahua VTO Intercom.  Other models not tested but may work. This could be used for gate or door release.
When unlocked (or when you ask Siri to *“Open the gate”*), the plugin sends a Dahua CGI command to open it. 
The plugin adds a virtual switch to HomeKit. Turning it on (or asking Siri) sends `openDoor` CGI command to a Dahua VTO2111D intercom.

## Homebridge install
1. Search for the plugin 'Homebridge Dahua Gate Releaase' and select to install. 

### Prerequisites

- To use this plugin, you will need to already have:
  - Dahua VTO intercom with CGI Enabled within its Local Settings and unlock duration set.
  - [Node](https://nodejs.org): latest version of `v22` or `v24`. (`26` not tested)
  - [Homebridge](https://homebridge.io): `v1.6`-`v2.0.1`

## Configuration

Once installed, go to the plugin config and configure the appropriate details as below.
Restart the plugin
Enable to Child Bridge
Scan the QR in the Home app by adding a new accessory.
Button should now appear within the Apple Home app or you can control via Siri.


## Addition information
The gate/door button will default to showing a 'Locked' state and switch to 'Unlocked' temporarily for the number of unlock seconds you define in the plugin before reverting
the button back to a virtual locked state. Align the unlock duration in set in the Intercom to the unlock duration within the plugin.
You can also disable relocking of the virtual butotn if necessary by entering '0' (zero) unlock duration.


## Automation

If you're attempting to automate an unlock or lock of the door/gate, Apple's treatment of security devices like Gates, Garage doors
and Security Systems can be tricky to automate based on geolocation services or remote access. Thus, you'll need to use another virtual/dummy accessory, using
another Homebridge plugins such as 'Homebridge Virtual Accessories'. 


Designed for the **Dahua VTO2111** intercom, but likely to work with many other Dahua / Rebranded VTO Intercom models with CGI Enabled.

---

## ✨ Features

- Unlock your gate using **Siri**, **Apple Home**, or **Automations**
- Uses **Digest Auth** for secure communication
- Automatic **re-lock** of the virtual button after a configurable delay
- Retry logic with configurable attempts + delay
- Polling to detect intercom availability
- Full support for **Child Bridge** mode

---

## 📦 Installation

1. Open **Homebridge UI**  
2. Go to **Plugins**  
3. Search for **“Homebridge Dahua Gate Release”**  
4. Install the plugin  
5. Configure to your intercom
6. Restart Homebridge

---

## ⚙️ Configuration

After installation:

1. Open the plugin settings  
2. Enter your Dahua intercom details (set unlock duration to be the same duration within the intercom)
3. Enable **Child Bridge** (recommended)  
4. Save & restart Homebridge  
5. Scan the QR code in the Home app to add the accessory

### Example configuration


```json
{
    "fallbackRetries": 2,
    "fallbackDelay": 5000,
    "autoLockTime": 20,
    "autoLockUnit": "seconds",
    "pollInterval": 60000,
    "verboseLogging": true,
    "ip": "192.168.1.110",
    "username": "admin",
    "password": "admin",
    "name": "DahuaGateRelease",
    "_bridge": {
        "name": "Homebridge Dahua Gate Release",
        "username": "00:AA:00:AA:00:AA",
        "port": 30645
    },
    "accessoryName": "Dahua Gate",
    "platform": "DahuaGateRelease"
}
```

### Disclaimer

- I have created this plugin in my own time free for you to use.
- I have no affiliation with Dahua or any company rebanding Dahua devices.
- Use this plugin at your own risk.
- You are licensed to use this plugin free of charge but within the limits of the MIT license distributed with this plugin.
