# Getting Started with PhillOS

PhillOS is an AI-native operating system concept where the orchestrator coordinates applications on the user's behalf. This guide consolidates the basic steps from the README and Blueprint so you can build the bootloader, run the backend services, and experiment with Agent Mode.

## Prerequisites

- Node.js and npm
- A modern web browser
- Build tools for the bootloader (`make`, `x86_64-elf-gcc`, `binutils`, `gnu-efi`, `dosfstools`, `mtools`, `grub-mkrescue`)
- Rust and Cargo
- Go toolchain
- Python 3

## Build the Bootloader and Kernel

1. (Optional) build the WebAssembly models:
   ```bash
   npm run build-wasm
   ```
2. Run the main build script which compiles the bootloader, kernel and web UI:
   ```bash
   ./scripts/build.sh
   ```
3. To create a bootable ISO image run:
   ```bash
   make -C bootloader OUT_DIR=../dist/bootloader iso
   ```
   Flash `dist/bootloader/phillos.iso` to a USB drive with `dd` or a graphical tool and boot on UEFI hardware or QEMU.

## Build and Start the Backend

PhillOS bundles two small native backends. Build them once before running the server:

```bash
cd src-tauri
cargo build --release
cd ../src/backend
# build the Go module
go build -o ../../dist/phillos-server github.com/phillos/backend
# or run the server directly
go run github.com/phillos/backend
cd ..
```

Start the Go/Node server:
```bash
npm run server
```
If upgrading from an earlier version remove `storage/phillos.db` or run
`npm run setup-db` to create the new shared tags table.

## Launch the Tauri Front-End

In a separate terminal start the Vite dev server and the Tauri shell:
```bash
npm run dev
npx tauri dev
```
The Tauri window points at the Vite dev URL configured in `tauri.conf.json`.

## Enabling Agent Mode

The orchestrator interprets natural language intents and coordinates the built-in apps. Start it with:
```bash
npx phillos agent start
```

You can then invoke helper commands, for example schedule a task and generate SmartTags:
```bash
npx phillos scheduler smart_slot '{"tasks":["email team 15m"]}'
npx phillos smarttags notes/todo.txt
```
The agent launches apps like TimeAI and Vault behind the scenes and streams data between them using its event bus.

## Built-In Applications

The prototype includes several demo apps that participate in workflows:

- **SecureCore** – firewall controls and threat scans
- **MediaSphere** – browse media and request analysis
- **SoundScape** – list demo tracks
- **Pulse Monitor** – show a mocked heart rate
- **VisionVault** – image gallery with SmartTags
- **SpaceManager** – disk usage viewer
- **AppForge** – simulate building a project
- **BrainPad** – simple notes
- **ConverseAI** – basic chat interface
- **InBoxAI** – email viewer with AI summaries
- **WebLens** – fetch and summarise a webpage
- **GenLab** – compare model responses with PromptCoach tips
- **TimeAI** – calendar with an AI scheduler
- **Vault** – browse the filesystem and run SmartTags

Additional services registered with the agent include **AutoPatch**, **MemoryHub**, **Workspace Snapshots** and **System Stats**.

With the backend, Tauri shell and agent running you can explore these apps and issue natural language requests. The orchestrator will open the necessary apps and pass data between them to fulfil your intent.

For more technical details see the other documentation files in the `docs/` directory.
