# Changelog

All notable changes to this project will be documented in this file.

---
## [2.1.4] - 2026-05-11
### Added
- New `accessoryName` config option allowing users to name the HomeKit accessory independently of the platform/child bridge name
- Updated UUID generation to use `accessoryName`
- Automatic accessory renaming when config changes
### Added
- Automatic migration logic to adopt old accessory plugin UUID ("Dahua Gate Release")
- Prevents duplicate accessories after upgrade
- Automatically renames old cached accessory to new `accessoryName`


### Changed
- Updated config.schema.json to include new field
- Updated README and release notes to document new naming feature

## [2.0.0] - 2026-05-08
### Major
- Fully rewritten as a **Homebridge platform plugin**
- Replaced `dahua-gate-index.js` with new `index.js` entry point
- Added dynamic accessory creation (Lock Mechanism)
- Added full support for **Child Bridge** mode
- Added safe async handling for Node.js 18–26
- Added Axios request timeouts and improved error handling
- Added retry logic with configurable attempts and delay
- Added auto-lock scheduling with tracked timers
- Added polling system with safe shutdown cleanup
- Added verbose logging mode
- Added updated `config.schema.json` for Homebridge UI

### Changed
- Updated `package.json` with correct platform metadata
- Updated `files` whitelist for npm publishing
- Improved UUID generation and accessory caching
- Improved logging clarity and consistency
- Updated README and release notes to reflect new architecture

### Removed
- Old accessory-style implementation
- Deprecated `dahua-gate-index.js` and reverted to `index.js`
- Legacy timer logic and untracked async behaviour

---

## [1.1.24] - 2026-04-30
### Added
- Declared supported Node.js versions (`>=18.0.0`)
- Added Homebridge plugin metadata (`pluginType: accessory`)
- Improved keyword list for better plugin discoverability

### Changed
- Updated minimum Homebridge version to `>=1.6.0`
- Cleaned and reorganized `package.json`

---

## [1.1.15] - 2025-xx-xx
- Previous maintenance release
