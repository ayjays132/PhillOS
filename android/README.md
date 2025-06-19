# Android Container Integration (Experimental)

This directory contains early exploration work for running a containerized Android environment alongside PhillOS.

## Concept

The goal is to launch an Android distribution inside a container (such as Anbox or an equivalent runtime) and expose its display back to PhillOS. Input events from the user would be forwarded into the container so that Android apps can be interacted with like native ones.

Integration with the Google Play Store involves installing Google Play services or using microG inside the container. Once configured, users could sign in with a Google account to install applications from the Play Store.

## Planned Steps

1. Build or obtain a minimal Android container image.
2. Use `controller.ts` to start and stop the container.
3. Forward the Android display via a virtual display or VNC/Wayland bridge.
4. Relay keyboard, mouse and touch input to the container.
5. Provide scripts to configure Play services and login.

This README outlines ideas only; no production implementation exists yet.
