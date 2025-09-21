"use strict";

const AxiosDigestAuth = require("@mhoc/axios-digest-auth").default;
let Service, Characteristic;

module.exports = (homebridge) => {
  Service        = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory(
    "homebridge-dahua-gate-release",   // plugin ID
    "Dahua Gate Release",              // accessory name (aligned with config.schema.json)
    DahuaGateRelease
  );
};

class DahuaGateRelease {
  constructor(log, config) {
    this.log             = log;
    this.name            = config.name;
    this.ip              = config.ip;
    this.username        = config.username;
    this.password        = config.password;
    this.pollInterval    = config.pollInterval    ?? 60000;
    this.verboseLogging  = config.verboseLogging  ?? false;
    this.fallbackRetries = config.fallbackRetries ?? 1;
    this.fallbackDelay   = config.fallbackDelay   ?? 5000;
    this.autoLockTime    = config.autoLockTime    ?? 0;
    this.autoLockUnit    = config.autoLockUnit    ?? "seconds";
    this._faultState     = Characteristic.StatusFault.NO_FAULT;

    this.client = new AxiosDigestAuth({
      username: this.username,
      password: this.password
    });

    this.service = new Service.LockMechanism(this.name);

    this.service
      .getCharacteristic(Characteristic.StatusFault)
      .on("get", cb => cb(null, this._faultState));

    this.service
      .getCharacteristic(Characteristic.LockCurrentState)
      .on("get", this.handleGetCurrentState.bind(this));

    this.service
      .getCharacteristic(Characteristic.LockTargetState)
      .on("get", this.handleGetTargetState.bind(this))
      .on("set", this.handleSetTargetState.bind(this));

    this.startPolling();
  }

  getServices() {
    return [this.service];
  }

  handleGetCurrentState(callback) {
    callback(null, Characteristic.LockCurrentState.SECURED);
  }

  handleGetTargetState(callback) {
    callback(null, Characteristic.LockTargetState.SECURED);
  }

  async handleSetTargetState(value, callback) {
    if (value === Characteristic.LockTargetState.UNSECURED) {
      this.log.info(`Sending openDoor command to ${this.ip}`);
      const url = `http://${this.ip}/cgi-bin/accessControl.cgi?action=openDoor&channel=1&UserID=0`;
      let attempts = 0;

      const doRequest = async () => {
        try {
          const resp = await this.client.request({ url, method: "GET" });
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
            setTimeout(doRequest, this.fallbackDelay);
          }
        }
      };

      await doRequest();
    }

    callback();
  }

  scheduleAutoLock() {
    if (this.autoLockTime > 0) {
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

      setTimeout(() => {
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
  }

  startPolling() {
    setInterval(async () => {
      try {
        await this.client.request({ url: `http://${this.ip}/`, method: "GET" });
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
    }, this.pollInterval);
  }
}
