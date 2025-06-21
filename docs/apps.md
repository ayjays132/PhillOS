# PhillOS Application Overview

This document summarizes the demo applications bundled with the prototype. They are all built together as part of the web UI. Run `npm run dev` during development or `npm run build && npm run preview` for a production build. The backend API server is started with `npm run server`.

## SecureCore
- **Purpose:** control the firewall and perform quick scans.
- **API:** `/api/securecore/status`, `/api/securecore/toggle`, `/api/securecore/scan`, `/api/securecore/threat`, `/api/securecore/threatpredict`

## MediaSphere
- **Purpose:** browse videos and request AI analysis.
- **API:** `/api/mediasphere/media`, `/api/mediasphere/analyze`

## SoundScape
- **Purpose:** list demo music tracks.
- **API:** `/api/soundscape/tracks`

## Pulse Monitor
- **Purpose:** display a mocked heart rate.
- **API:** `/api/pulsemonitor/status`

## VisionVault
- **Purpose:** image gallery with SmartTags and AR capabilities.
- **API:** `/api/visionvault/images`, `/api/visionvault/index`, `/api/visionvault/enhance`, `/api/visionvault/ar_memories`

## SpaceManager
- **Purpose:** show disk usage information.
- **API:** `/api/spacemanager/usage`

## AppForge
- **Purpose:** simulate building a project.
- **API:** `/api/appforge/build`

## BrainPad
- **Purpose:** simple note pad stored in local storage.

## ConverseAI
- **Purpose:** basic chat interface.
- **API:** `POST /api/converseai`

## InBoxAI
- **Purpose:** demo mail reader with AI summaries.
- **API:** `/api/inboxai/messages`, `/api/inboxai/summary`

## WebLens
- **Purpose:** fetch an article and summarise it.
- **API:** `/api/weblens/summarize?url=...`

## GenLab
- **Purpose:** compare responses from two models and provide PromptCoach tips.
- **API:** `POST /api/genlab/compare`
- **Usage:** as you type a prompt, `genlab.prompt_coach` generates bullet point tips to refine it.

## TimeAI
- **Purpose:** calendar with scheduling powered by `timeai_scheduler.py`.
- **API:** Tauri commands `load_events`, `save_event`, `call_scheduler`

## Vault
- **Purpose:** browse the filesystem and run SmartTags on a file.
- **API:** Tauri commands `list_dir`, `copy_file`, `move_file`, `smart_tags`
- **Usage:** press **AutoClean** to call `autoclean.suggest` and list stale files. Archive or delete them directly from the app.

Each application is intentionally lightweight. They are orchestrated by the Agent mode which can invoke their services to fulfil complex requests.


## Additional Agent Actions

These services expose new AI capabilities through the orchestrator:

- **AutoPatch:** `autopatch.start` and `autopatch.stop` manage background OS updates.
- **MemoryHub:** store short-term context with `memoryhub.add_entry` and retrieve it using `memoryhub.get_windows`.
- **Workspace Snapshots:** save and restore layouts via `workspace.save` and `workspace.load`.
- **System Stats:** query the kernel scheduler using `system.query_scheduler` or receive hot-plug events with `system.device_event`.

Use `npx phillos agent start` and speak or type natural language requests. The orchestrator maps them onto these actions automatically.
