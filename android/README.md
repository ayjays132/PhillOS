# Android Container Integration (Experimental)

This directory contains scripts for running a containerized Android environment alongside PhillOS using [Waydroid](https://waydro.id/).

## Concept

The goal is to launch an Android distribution inside a container and expose its display back to PhillOS. Input events from the user are forwarded into the container so Android apps can be interacted with like native ones.

Google Play Store compatibility is achieved by installing the open-source **microG** replacement for Play services. A helper script `setup-microg.sh` is provided to download the required APKs and install them via `adb`.

## Usage

1. Ensure Waydroid is installed on your Linux system and that `adb` is available.
2. Start the container:

   ```bash
   ts-node controller.ts start
   ```

   This launches the Waydroid container and starts the display/input bridge.

3. (Optional) Install microG for Play Store support:

   ```bash
   ./setup-microg.sh
   ```

   After installation, reboot the container and sign in with your Google account using the included Play Store stub.

4. Stop the container when finished:

   ```bash
   ts-node controller.ts stop
   ```

## Offline Usage

`setup-microg.sh` caches the required APKs under `android/downloads/`. Once the
files exist you can copy them to another system and run the installer with
offline mode enabled:

```bash
OFFLINE=1 ./setup-microg.sh
```

The container itself works without internet connectivity after it has been
installed. Simply start and stop as usual:

```bash
ts-node controller.ts start
...
ts-node controller.ts stop
```
