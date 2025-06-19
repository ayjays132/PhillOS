# Android Container Integration (Experimental)

This directory contains scripts for running a containerized Android environment alongside PhillOS using [Waydroid](https://waydro.id/).

## Concept

The goal is to launch an Android distribution inside a container and expose its display back to PhillOS. Input events from the user are forwarded into the container so Android apps can be interacted with like native ones.

Google Play Store compatibility is achieved by installing the open-source **microG** replacement for Play services. A helper script `setup-playstore.sh` is provided to download the required APKs (or use ones you already have) and install them via `adb`.

## Usage

1. Ensure Waydroid is installed on your Linux system and that `adb` is available.
2. Start the container:

   ```bash
   ts-node controller.ts start
   ```

   This launches the Waydroid container and starts the display/input bridge.

3. (Optional) Install microG for Play Store support:

   ```bash
   ./setup-playstore.sh
   ```

   After installation, reboot the container and sign in with your Google account using the included Play Store stub.

4. Stop the container when finished:

   ```bash
   ts-node controller.ts stop
   ```

## Offline Usage

`setup-playstore.sh` caches the required APKs under `android/downloads/`. Once the
files exist you can copy them to another system and run the installer with
offline mode enabled:

```bash
OFFLINE=1 ./setup-playstore.sh
```

The container itself works without internet connectivity after it has been
installed. Simply start and stop as usual:

```bash
ts-node controller.ts start
...
ts-node controller.ts stop
```

### Updating Packages Offline

Package versions and download URLs are defined in `package_versions.json`.
When the scripts run in online mode they will automatically download any
package whose checksum differs from the value listed in this file. For
systems without internet access you can pre-populate the `downloads/`
directory with the APKs referenced in the configuration. The scripts
verify the SHA-256 checksum of each file before installing it.

To update an offline installation:

1. On a machine with internet access, edit `package_versions.json` to
   reflect the desired versions and run either setup script once so the
   new APKs are downloaded to `android/downloads/`.
2. Copy the updated `downloads/` directory and `package_versions.json`
   to the target system.
3. Run the installer with offline mode enabled:

```bash
OFFLINE=1 ./setup-playstore.sh
```

The same process applies to `setup-microg.sh`.
