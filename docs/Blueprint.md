# PhillOS Blueprint

This document consolidates the core architectural vision for PhillOS. It draws from the detailed blueprint and README to outline the system's goals, boot process, kernel design, and the agent-driven paradigm.

## North-Star Vision

PhillOS proposes an operating system where **AI is the OS itself**. The "Living Glass" design and deep contextual awareness work together to create an ambient, adaptive environment that anticipates user intent and personalizes every interaction. Core principles include:

- **Contextual Awareness** and proactive assistance that adjust to user behavior and environment.
- **Adaptive UI/UX** that responds to device form factor and input method.
- **Personalized Learning** while maintaining a **privacy-first** approach using local AI models by default.

## Boot Pipeline Overview

The project ships with a minimal bootloader and C-based kernel. Building an image involves:

1. Installing cross‑compiler and EFI tooling (`x86_64-elf-gcc`, `gnu-efi`, `grub-mkrescue`, etc.).
2. Running `./scripts/build.sh` to compile the bootloader, kernel, and web interface.
3. Creating an ISO with `make -C bootloader OUT_DIR=../dist/bootloader iso` and flashing it to a USB drive with `dd` or a graphical tool.
4. Booting on UEFI hardware (Secure Boot disabled) or via QEMU.

During this early boot phase, the kernel reserves a few pages exclusively for
the agent subsystem. `AGENT_MEMORY_PAGES` defines how many 4&nbsp;KiB pages are
set aside and these can be accessed through `agent_alloc()` and
`agent_free()`.

## CLI Integration with Boot Components

The TypeScript-based `phillos-cli` utility can tweak boot parameters and read
debug output from the kernel. When the OS is launched in QEMU, the CLI may
append options like `ai_mem=256` to the EFI command line. The bootloader parses
this value in `parse_ai_pages()` and reserves additional pages for the agent
heap before transferring control to the kernel. The resulting memory address and
the raw command line are stored in `boot_info_t` for `kernel_main()` to consume.

Kernel debug strings are written to I/O port `0xE9` by helpers in
`kernel/debug.c`. Running QEMU with `-debugcon stdio` allows the CLI to capture
this stream and issue diagnostics. Developers can implement a lightweight hook
such as `void cli_command(const char *line)` that reacts to messages received on
the debug channel—for example printing heap statistics or toggling log levels.

## Kernel Architecture

PhillOS envisions a single **AI‑native kernel** that integrates machine‑learning models for dynamic resource allocation, intelligent process scheduling, and self‑healing. Memory management and task prioritization adapt to predicted user needs. A responsive UI layer sits above this kernel, scaling across phones, desktops, and other devices.

## Agent Mode

The blueprint describes an orchestration layer of **PhillOS Agents**:

- Agents interpret high‑level intent expressed in natural language.
- They decompose complex tasks, delegate work to applications or micro‑agents, and pass data between them.
- Continuous learning and explainable controls let users review and adjust an agent's plan.

This architecture aims to turn the OS into a proactive digital partner that manages workflows on the user's behalf.


## Roadmap: DX12 Compatibility

PhillOS intends to run modern Windows games that rely on DirectX 12. The initial approach leverages Proton with the vkd3d-proton project to translate DX12 calls into Vulkan commands.

1. **Integrate Proton in a container** so Windows games run isolated from the host OS.
2. **Expose Vulkan drivers** from the host kernel to the Proton environment.
3. **Bundle vkd3d-proton** and keep it updated through the PhillOS package manager.
4. **Create a launcher service** that configures per-game prefixes, shader caches and FSR settings automatically.
5. **Iterate with real-world testing** on popular DX12 titles and tune performance.

This roadmap aims to provide near-native compatibility for Windows games while keeping the core OS lightweight.

## PWA Service Worker and Updates

PhillOS uses the Vite PWA plugin to generate a service worker during `vite build`.
The plugin's `generateSW` strategy scans the final build output and writes
`service-worker.js` with precache information derived from the `globPatterns`
and `additionalManifestEntries` options in `vite.config.ts`. The service worker
is registered in **auto-update** mode so every page load checks for a newer
version.

### How updates are applied

When a new build is deployed, the browser downloads the updated service worker
in the background. After the next reload it becomes active and serves the new
assets, automatically clearing outdated caches.

### Troubleshooting stale caches

If you still see an older UI after deploying a new version:

1. Open the browser's developer tools and navigate to **Application → Service Workers**.
2. Click **Unregister** or enable **Update on reload**, then refresh the page.
3. If the issue persists, clear the site's stored data to remove cached files.

## Application Layout and Backends

PhillOS keeps each system application in its own folder under `src/apps/`. Every
subdirectory exposes a React component through an `index.ts` entry point so apps
can be imported lazily by the main shell. For example `src/apps/vault/` contains
the **Vault** file manager implemented in `Vault.tsx`.

Two small native backends complement the TypeScript UI:

- `src-tauri/` – a Rust project built with Tauri that provides file system
  commands (`list_dir`, `copy_file`, `move_file`) which the Vault app invokes
  through the Tauri JavaScript API.
- `src/backend/` – a Go server offering HTTP endpoints for theme management and
  Proton game launching. It proxies phone bridge requests and spawns the Node
  `protonLauncher.js` helper when needed.

The **Agent Orchestrator** (`services/agentOrchestrator.ts`) sits above the
lower level `agentService` and coordinates these pieces. It interprets user
intents, launches applications, passes data between them and monitors
completion through an internal event bus. Individual apps remain focused on
their UI logic while the orchestrator routes intent and workflow data.

### Building the Rust backend

```bash
cd src-tauri
cargo build --release
```

The resulting binary can be bundled with the UI to enable the Vault's native
file operations.

### Building the Go server

```bash
cd src/backend
go build -o ../../dist/phillos-server
```

Run the produced executable to serve `/api` endpoints alongside the web UI.

### Agent Orchestrator Event Bus

`services/agentOrchestrator.ts` exposes a lightweight event bus so apps can
participate in multi‑step workflows. Consumers register listeners with
`agentOrchestrator.on(event, handler)` and receive notifications when the agent
launches an app, streams intermediate data or marks a task complete.

Supported events:

- **`launch`** – `{ app, params, taskId }` indicates an application should be
  opened.
- **`data`** – `{ taskId, data }` passes intermediate information between apps.
- **`complete`** – `{ taskId, result }` signals a workflow finished
  successfully.
- **`fail`** – `{ taskId, error }` notifies listeners of a failure.

`processIntent(text)` returns a task object describing the chosen action and
emits the initial events. Apps can update the task state by calling
`markComplete()` or `markFailed()` on the orchestrator.

