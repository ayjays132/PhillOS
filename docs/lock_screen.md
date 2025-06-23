# Lock Screen

The Living Glass lock screen provides a secure gateway into PhillOS. It features
username and password authentication with optional facial recognition. A simple
Wi-Fi selector allows network configuration before logging in and an optional
media widget exposes basic playback controls so you can pause or resume audio
without unlocking.

## Setup

1. Ensure a webcam or compatible biometric device is connected if you wish to use
   facial recognition. The browser must support WebAuthn for the built‑in face
   login method or PhillOS' `visionVaultService` will be used as a fallback.
2. No backend setup is required. User credentials are verified locally in this
   prototype.

## Hardware Requirements

- A modern browser supporting WebAuthn (for face login)
- Optional webcam for the `visionVaultService` fallback
- Standard input devices to enter credentials
