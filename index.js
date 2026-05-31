console.log("LOADING THE REAL PLUGIN FOLDER");

"use strict";

const path = require("path");

// ------------------------------
// DEPENDENCY LOADER + CHILD BRIDGE HANDLING
// ------------------------------

/**
 * Detect if we are running inside a Homebridge child bridge.
 * Homebridge sets HOMEBRIDGE_CHILD_BRIDGE=1 for child bridge processes.
 */
function isChildBridge() {
  return process.env.HOMEBRIDGE_CHILD_BRIDGE === "1";
}

/**
 * Robust loader for dependencies that:
 *  - Works in dev + production (resolves from __dirname + process.cwd()).
 *  - Detects missing deps inside a child bridge.
 *  - Triggers an automatic child-bridge rebuild when needed.
 */
function loadDependency(name) {
  const header = "[homebridge-dahua-gate-release]";

  try {
    const resolved = require.resolve(name, {
      paths: [__dirname, process.cwd()],
    });
    return require(resolved);
  } catch (err) {
    const inChild = isChildBridge();

    console.error(`${header} Failed to load dependency '${name}'.`);
    console.error(
      `${header} Node error: ${err && err.message ? err.message : String(err)}`
    );

    if (inChild) {
      console.error(
        `${header} Detected Homebridge child bridge environment (HOMEBRIDGE_CHILD_BRIDGE=1).`
      );
      console.error(
        `${header} This usually means the child-bridge sandbox was created with an older version of the plugin and is missing new dependencies.`
      );
      console.error(
        `${header} Homebridge will now restart this child bridge and rebuild its environment.`
      );
      console.error(
        `${header} No manual action should be required. If the problem persists, remove and re-add the child bridge from the UI.`
      );

      // Non-zero exit code used to signal:
      // "this child bridge environment is broken; rebuild it".
      process.exit(216);
    } else {
      console.error(
        `${header} This instance is not running in a child bridge.`
      );
      console.error(
        `${header} Please reinstall the plugin or run 'npm install ${name}' in your Homebridge directory.`
      );
      throw err;
    }
  }
}

// Load digest-fetch using the robust loader above.
const DigestFetch = loadDependency("digest-fetch");

let Service, Characteristic, UUIDGen;

/**
 * MODERN HOMEBRIDGE API ENTRY POINT
 * ---------------------------------
 * This is the correct, supported way to register a platform.
 * Homebridge WILL load this.
 */
module.exports = (api) => {
  Service        = api.hap.Service;
  Characteristic = api.hap.Characteristic;
  UUIDGen        = api.hap.uuid;

  api.registerPlatform("DahuaGateRelease", DahuaGateReleasePlatform);
};

class DahuaGateReleasePlatform {
  constructor(log, config, api) {
    this.log    = log;
    this.config = config;
    this.api    = api;

    if (!config) {
      this.log.warn("No configuration found for DahuaGateRelease platform");
      return;
    }

    // ------------------------------
    // CONFIG DEFAULTS + VALIDATION
    // ------------------------------
    const defaults = {
      name: "Dahua Gate Release",
      accessoryName: "Dahua Gate",
      ip: "192.168.1.110",
      username: "",
      password: "",
      pollInterval: 60000,
      verboseLogging: false,
      fallbackRetries: 1,
      fallbackDelay: 5000,
      autoLockTime: 20,
      autoLockUnit: "seconds"
    };

    this.config = { ...defaults, ...config };

    const requiredFields = ["name", "accessoryName", "ip", "username", "password"];
    const missing = requiredFields.filter(f => {
      const val = this.config[f];
      return typeof val !== "string" || val.trim() === "";
    });

    if (missing.length > 0) {
      this.log.error("DahuaGateRelease plugin configuration is invalid.");
      this.log.error("The following required fields are missing or empty:");
      missing.forEach(f => this.log.error(` - ${f}`));
      this.log.error("Plugin will NOT load until configuration is corrected.");
      return;
    }

    // Assign config
    this.platformName    = this.config.name;
    this.accessoryName   = this.config.accessoryName;
    this.ip              = this.config.ip;
    this.username        = this.config.username;
    this.password        = this.config.password;
    this.pollInterval    = this.config.pollInterval;
    this.verboseLogging  = this.config.verboseLogging;
    this.fallbackRetries = this.config.fallbackRetries;
    this.fallbackDelay   = this.config.fallbackDelay;
    this.autoLockTime    = this.config.autoLockTime;
    this.autoLockUnit    = this.config.autoLockUnit;

    this._pollTimer   = null;
    this._retryTimer  = null;
    this._autoTimer   = null;

    // digest-fetch client
    this.client = new DigestFetch(this.username, this.password, {
      algorithm: "MD5",
      basic: false
    });

    this.accessories = [];

    this.api.on("didFinishLaunching", async () => {
      this.log.info("DahuaGateRelease platform finished launching");

      const ok = await this.healthCheck();
      if (!ok) {
        this.log.error("Plugin will NOT load due to failed health check");
        return;
      }

      this.initAccessory();
      this.startPolling();
    });

    this.api.on("shutdown", () => {
      this.shutdown();
    });
  }

  // ------------------------------
  // HEALTH CHECK
  // ------------------------------
  async healthCheck() {
    const url = `http://${this.ip}/`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const resp = await this.client.fetch(url, {
        method: "GET",
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!resp.ok) {
        this.log.error(`Health check FAILED — HTTP ${resp.status}`);
        return false;
      }

      this.log.info("Health check OK — device reachable and authenticated");
      return true;

    } catch (err) {
      if (err.name === "AbortError") {
        this.log.error("Health check FAILED — request timed out");
      } else {
        this.log.error(`Health check FAILED — ${err.message}`);
      }
      return false;
    }
  }

  configureAccessory(accessory) {
    this.log.info("Restoring cached accessory:", accessory.displayName);
    this.accessories.push(accessory);
  }

  initAccessory() {
    const oldName = "Dahua Gate Release";
    const oldUUID = UUIDGen.generate(oldName);
    const newUUID = UUIDGen.generate(this.accessoryName);

    let accessory =
      this.accessories.find(a => a.UUID === newUUID) ||
      this.accessories.find(a => a.UUID === oldUUID);

    if (!accessory) {
      accessory = new this.api.platformAccessory(this.accessoryName, newUUID);
      accessory.addService(Service.LockMechanism, this.accessoryName);

      this.api.registerPlatformAccessories(
        "homebridge-dahua-gate-release",
        "DahuaGateRelease",
        [accessory]
      );

      this.log.info("Created new accessory:", this.accessoryName);
    } else {
      this.log.info("Using existing accessory:", accessory.displayName);
    }

    this.accessory = accessory;

    let service = accessory.getService(Service.LockMechanism);

    if (!service) {
      this.log.warn("Cached accessory had no LockMechanism service — creating a new one.");
      service = accessory.addService(Service.LockMechanism, this.accessoryName);
    }

    if (accessory.displayName !== this.accessoryName) {
      this.log.info(`Renaming accessory to: ${this.accessoryName}`);
      accessory.displayName = this.accessoryName;
    }

    service.setCharacteristic(Characteristic.Name, this.accessoryName);

    this.service = service;

    this._faultState = Characteristic.StatusFault.NO_FAULT;

    this.service
      .getCharacteristic(Characteristic.StatusFault)
      .onGet(() => this._faultState);

    this.service
      .getCharacteristic(Characteristic.LockCurrentState)
      .onGet(() => Characteristic.LockCurrentState.SECURED);

    this.service
      .getCharacteristic(Characteristic.LockTargetState)
      .onGet(() => Characteristic.LockTargetState.SECURED)
      .onSet(this.handleSetTargetState.bind(this));
  }

  async handleSetTargetState(value) {
    if (value !== Characteristic.LockTargetState.UNSECURED) return;

    this.log.info(`Sending openDoor command to ${this.ip}`);

    const url = new URL("/cgi-bin/accessControl.cgi", `http://${this.ip}`);
    url.searchParams.set("action", "openDoor");
    url.searchParams.set("channel", "1");
    url.searchParams.set("UserID", "0");

    let attempts = 0;

    const doRequest = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const resp = await this.client.fetch(url.toString(), {
          method: "GET",
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (this.verboseLogging) {
          this.log.debug(`HTTP ${resp.status}`);
        }

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        this.service.updateCharacteristic(
          Characteristic.LockCurrentState,
          Characteristic.LockCurrentState.UNSECURED
        );

        this.scheduleAutoLock();

      } catch (err) {
        attempts++;
        this.log.error(`openDoor failed (try ${attempts}): ${err.message}`);

        if (attempts <= this.fallbackRetries) {
          this._retryTimer = setTimeout(doRequest, this.fallbackDelay);
        }
      }
    };

    await doRequest();
  }

  scheduleAutoLock() {
    if (this.autoLockTime <= 0) return;

    const unitMs = {
      seconds: 1000,
      hours:   3600000,
      days:    86400000
    };

    const delay = this.autoLockTime * (unitMs[this.autoLockUnit] || 1000);

    if (this.verboseLogging) {
      this.log.debug(
        `Auto-lock scheduled in ${this.autoLockTime} ${this.autoLockUnit} (${delay}ms)`
      );
    }

    this._autoTimer = setTimeout(() => {
      this.service.updateCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.SECURED
      );
      this.service.updateCharacteristic(
        Characteristic.LockTargetState,
        Characteristic.LockTargetState.SECURED
      );

      if (this.verboseLogging) {
        this.log.debug("Auto-lock executed");
      }
    }, delay);
  }

  startPolling() {
    this._pollTimer = setInterval(() => {
      this.pollOnce().catch(err => {
        this.log.error("Poll error:", err.message);
      });
    }, this.pollInterval);
  }

  async pollOnce() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const resp = await this.client.fetch(`http://${this.ip}/`, {
        method: "GET",
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (this.verboseLogging) {
        this.log.debug("Intercom reachable");
      }

      this._faultState = Characteristic.StatusFault.NO_FAULT;

    } catch (err) {
      this.log.error(`Poll failed: ${err.message}`);
      this._faultState = Characteristic.StatusFault.GENERAL_FAULT;
    }

    this.service.updateCharacteristic(
      Characteristic.StatusFault,
      this._faultState
    );
  }

  shutdown() {
    if (this._pollTimer) clearInterval(this._pollTimer);
    if (this._retryTimer) clearTimeout(this._retryTimer);
    if (this._autoTimer) clearTimeout(this._autoTimer);

    this.log.info("DahuaGateRelease platform shutdown complete");
  }
}
