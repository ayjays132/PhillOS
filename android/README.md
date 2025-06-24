# Android Container Integration (Experimental)

This directory contains scripts for running a containerized Android environment alongside PhillOS using [Waydroid](https://waydro.id/).

## Concept

The goal is to launch an Android distribution inside a container and expose its display back to PhillOS. Input events from the user are forwarded into the container so Android apps can be interacted with like native ones.

Google Play Store compatibility is achieved by installing the open-source **microG** replacement for Play services. A helper script `setup-playstore.sh` is provided to download the required APKs (or use ones you already have) and install them via `adb`.

## Usage

1. Ensure Waydroid is installed on your Linux system and that `adb` is available.
2. (First time only) create the Waydroid container:

   ```bash
   sudo waydroid init
   ```

   This downloads the base Android image and sets up the LXC container.
3. Start the container:

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

### Copying Cached APKs

If you plan to install the Play Store on a machine without internet
connectivity, run the installer once on an online system to populate the
`android/downloads/` directory. Copy this directory along with
`package_versions.json` to the target system. The installer will reuse
the cached files when `OFFLINE=1` is set.

### Verifying Play Store Offline

After installing microG and the Play Store stub you can confirm that
everything works without internet access:

1. Start the container normally:

   ```bash
   ts-node controller.ts start
   ```

2. Launch **microG Settings** inside Waydroid and open the **Self-Check**
   screen. All items should show as *OK*.
3. Open the Play Store icon. Even offline it should load and display
   your account information if you signed in previously.
4. If the store opens without crashing your setup is complete and you
   can sideload additional APKs using `adb install` as needed.

## Troubleshooting

* **`adb` cannot find the device** – Run `adb connect 127.0.0.1:5555`
  followed by `adb devices`. If the device remains offline try
  `adb kill-server` then reconnect.
* **Container fails to start** – Check the output of `waydroid log`
  for errors and verify that both `waydroid container start` and
  `waydroid session start` succeed.
* **Permission errors with `adb`** – Some commands require root inside
  the container. Use `adb root` before running the installer scripts.
* **Display window does not appear** – Make sure Waydroid's session
  service is running and use `waydroid show-full-ui` to open the UI.
