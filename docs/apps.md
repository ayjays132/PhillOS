# PhillOS Application Overview

This document summarizes the conceptual applications included in the prototype and how they demonstrate the agent oriented design of PhillOS. All apps share the global theme system which can be toggled between dark and light modes from the settings panel.

## SecureCore
* **Firewall control** – toggle the software firewall and initiate quick scans.
* **Backend integration** – communicates with `/api/securecore/*` endpoints.

## MediaSphere
* **Media browser** displaying demo video items.
* **Video analysis** via `/api/mediasphere/analyze` showcasing content understanding.

## SoundScape
* **Track listing** pulled from `/api/soundscape/tracks`.

## Pulse Monitor
* **Heart rate display** that polls `/api/pulsemonitor/status` every few seconds.

## VisionVault
* **Image gallery** reading URLs from `/api/visionvault/images`.

## SpaceManager
* **Disk usage gauge** fed by `/api/spacemanager/usage`.

## AppForge
* **One click build** button calling `/api/appforge/build` to simulate compiling a project.

## BrainPad
* **Simple note pad** storing entries in local storage.

Each application is intentionally lightweight. They are meant to be orchestrated by higher level agents which can combine their capabilities— for example capturing images in VisionVault and running analysis in MediaSphere or attaching results to a BrainPad note. The components use the same `GlassCard` and theme utilities so they blend seamlessly with the rest of the UI.
