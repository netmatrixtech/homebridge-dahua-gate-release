## 🚀 Version 2.2.0 — Rewritten using Digest-Fetch module, Validation & Health Check

This release modernises the HTTP layer and hardens plugin startup behaviour.
NOTE: As this version changes node dependency, you will need to remove the previous version Child Bridge and Accessory and re-register a child bridge and accessory into Homekit.

### ✨ New
- Startup **health check** verifies device reachability and digest authentication
- Configuration defaults now applied automatically at runtime
- Plugin now validates required fields and refuses to load if invalid

### 🔧 Improved
- Replaced `@mhoc/axios-digest-auth` with `digest-fetch` for more reliable Digest Auth
- Updated `config.schema.json` to match runtime defaults (including IP `192.168.1.110`)
- Updated `package.json` to remove axios and add digest-fetch

---

## 🚀 Version 2.1.4 — Accessory Renaming Support

This update adds one of the most requested features:  
You can now name the HomeKit accessory separately from the platform/child bridge.

### ✨ New
- Added `accessoryName` config option  
- Accessory name now updates cleanly in HomeKit  
- UUID generation now based on accessoryName  
- Supports renaming without breaking cached accessories

### 🔧 Improved
- Updated schema, README, and internal logic to support new naming system

### 🛠 Migration Improvements
- Added automatic UUID migration from the old accessory plugin
- Prevents duplicate accessories appearing in the Home app
- Automatically renames the old accessory to match the new `accessoryName`

---

## 🚀 Version 2.0.0 — Major Platform Rewrite

This release is a complete architectural upgrade of the plugin.  
The plugin is now a **Homebridge Platform Plugin**, supporting Child Bridge mode, dynamic accessory creation, and modern HomeKit behaviour.
⚠️ NOTE: This release may break existing settings. If you encounter issues, please uninstall (keep config),remove any Dahua Gate Release bridges and accessories then reinstall and add child bridge.

### ✨ New
- Fully rewritten as a **platform plugin** (no longer an accessory plugin)
- New `index.js` entry point (replaces `dahua-gate-index.js`)
- Dynamic creation of a Lock Mechanism accessory (user‑named: Gate, Door, etc.)
- Full support for **Child Bridge** mode with independent pairing
- Added safe async handling for Node.js 18–26
- Added Axios request timeouts and improved error handling
- Added auto‑lock scheduling with tracked timers
- Added retry logic with configurable attempts + delay
- Added polling system with safe shutdown cleanup
- Added verbose logging mode
- Added updated `config.schema.json` for Homebridge UI

### 🔧 Improved
- Updated `package.json` with correct platform metadata
- Cleaned and modernised plugin structure
- Updated `files` whitelist for npm publishing
- Improved UUID generation and accessory caching
- Improved logging clarity and consistency
- Updated README and CHANGELOG to reflect new architecture

### 🗑 Removed
- Old accessory‑style implementation
- Deprecated file `dahua-gate-index.js`
- Legacy timer logic and untracked async behaviour

### ⚠️ Notes
- This is a breaking change.  
  Users must update their Homebridge config to use:

  ```json
  "platform": "DahuaGateRelease"
