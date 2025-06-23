# Lock Screen

The Living Glass lock screen provides a secure gateway into PhillOS. It supports
traditional credentials and optional biometrics while surfacing useful widgets
before you sign in.

## Features

- Username and password entry
- Facial recognition via WebAuthn
- Fallback visionVaultService when the browser lacks WebAuthn
- Quick Wi‑Fi selection before login
- Optional media widget to pause or resume playback

## Supported Cameras and Sensors

- Any webcam accessible through the browser's `getUserMedia` API
- Dedicated IR or depth cameras for improved accuracy
- Fingerprint readers via WebAuthn
- Microphones for voice authentication

## Setup

1. Run `npm run setup-db` to migrate the database and create the new `users`
   table.
2. Add at least one account with `node scripts/add-user.js <name> <password>`.
3. Ensure a webcam or compatible biometric device is connected if you wish to use
   facial recognition. The browser must support WebAuthn for the built‑in face
   login method or PhillOS' `visionVaultService` will be used as a fallback.

## Hardware Requirements

- A modern browser supporting WebAuthn (for face login)
- Optional webcam for the `visionVaultService` fallback
- Standard input devices to enter credentials

## Configuration

Enable or disable face, fingerprint, or voice login from **Settings → Security → Lock Screen**. This
panel also lets you choose which camera or sensor should be used.

## Fallback Authentication and Privacy

If no supported camera is available or recognition fails, you can always log in
with your password or a configured PIN. The optional `visionVaultService` runs
entirely on device and stores biometric templates locally, never sending raw
images to the cloud.
