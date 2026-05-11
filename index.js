"use strict";

const AxiosDigestAuth = require("@mhoc/axios-digest-auth").default;

let Service, Characteristic, UUIDGen;

module.exports = (homebridge) => {
  Service        = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen        = homebridge.hap.uuid;

  homebridge.registerPlatform(
    "homebridge-dahua-gate-release",
    "DahuaGateRelease",
    DahuaGateReleasePlatform
  );
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

    // Platform vs accessory naming
    this.platformName  = config.name;
    this.accessoryName = config.accessoryName || "Dahua Gate";

    this.ip              = config.ip;
    this.username        = config.username;
    this.password        = config.password;
    this.pollInterval    = config.pollInterval    ?? 60000;
    this.verboseLogging  = config.verboseLogging  ?? false;
    this.fallbackRetries = config.fallbackRetries ?? 1;
    this.fallbackDelay   = config.fallbackDelay   ?? 5000;
    this.autoLockTime    = config.autoLockTime    ?? 0;
    this.autoLockUnit    = config.autoLockUnit    ?? "seconds";

    this._pollTimer   = null;
    this._retryTimer  = null;
    this._autoTimer   = null;

    this.client = new AxiosDigestAuth({
      username: this.username,
      password: this.password
    });

    this.accessories = [];

    this.api.on("didFinishLaunching", () => {
      this.log.info("DahuaGateRelease platform finished launching");
      this.initAccessory();
      this.startPolling();
    });

    this.api.on("shutdown", () => {
      this.shutdown();
    });
  }

  configureAccessory(accessory) {
    this.log.info("Restoring cached accessory:", accessory.displayName);
    this.accessories.push(accessory);
  }

  initAccessory() {
    // Migration: old accessory plugin used name "Dahua Gate Release"
    const oldName = "Dahua Gate Release";
    const oldUUID = UUIDGen.generate(oldName);
    const newUUID = UUIDGen.generate(this.accessoryName);

    // Prefer new UUID, fall back to old UUID for migration
    let accessory =
      this.accessories.find(a => a.UUID === newUUID) ||
      this.accessories.find(a => a.UUID === oldUUID);

    if (!accessory) {
      // No cached accessory found, create a new one
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

    // Ensure LockMechanism service exists (cached accessories may not have it)
    let service = accessory.getService(Service.LockMechanism);

    if (!service) {
      this.log.warn("Cached accessory had no LockMechanism service — creating a new one.");
      service = accessory.addService(Service.LockMechanism, this.accessoryName);
    }

    // Rename accessory if needed
    if (accessory.displayName !== this.accessoryName) {
      this.log.info(`Renaming accessory to: ${this.accessoryName}`);
      accessory.displayName = this.accessoryName;
    }

    // Always keep Name characteristic in sync
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
        const resp = await this.client.request({
          url: url.toString(),
          method: "GET",
          timeout: 5000
        });

        if (this.verboseLogging) {
          this.log.debug(`HTTP ${resp.status}`);
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
      await this.client.request({
        url: `http://${this.ip}/`,
        method: "GET",
        timeout: 5000
      });

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
