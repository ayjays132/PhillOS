
# PhillOS - Living Glass AI-Native OS Concept

[![PhillOS Concept UI](https://user-images.githubusercontent.com/1234567/200000000-placeholder-image.png)](#)

**PhillOS represents a profound paradigm shift in operating system design, moving beyond traditional command-response interfaces to an intelligent, proactive, and deeply personalized user experience. This React-based prototype demonstrates core aspects of the "Living Glass" UI/UX and foundational AI-driven interactions envisioned for PhillOS.**

The core philosophy posits artificial intelligence (AI) not as an add-on feature but as the operating system itself—a pervasive intelligence designed to understand user intent, predict needs, and proactively optimize the entire system.

## Table of Contents

- [Introduction](#introduction)
- [Core Philosophy](#core-philosophy)
- [The "Living Glass" Design](#the-living-glass-design)
- [Technology Stack](#technology-stack)
- [Current Prototype Features](#current-prototype-features)
- [Getting Started](#getting-started)
- [Building the Bootloader & Kernel](#building-the-bootloader--kernel)
- [Project Structure](#project-structure)
- [Key Architectural Components](#key-architectural-components)
- [Future Vision (Conceptual)](#future-vision-conceptual)
- [Android Container (Experimental)](#android-container-experimental)
- [License](#license)

## Introduction

PhillOS is envisioned as a "Living Glass" system, where its distinctive aesthetic is deeply intertwined with its intelligent functionality, creating an immersive, intuitive, and visually captivating digital environment. This prototype explores these ideas using modern web technologies.

At its heart, PhillOS aims to be:
- **Contextually Aware**: Continuously learning and adapting based on user behavior, preferences, and context.
- **Proactively Assistant**: Anticipating user needs and offering relevant information or actions.
- **Adaptively Interfaced**: Featuring a fluid UI/UX that adjusts to the user, device, and task.
- **Personally Evolving**: Becoming more intuitive and helpful with every interaction.
- **Privacy-First**: Granting users granular control over their data with a strong emphasis on on-device processing.

## Core Philosophy

PhillOS is guided by several key principles:

1.  **Contextual Awareness**: The system learns from a rich tapestry of user behavior, preferences, location, time, and more (with explicit consent) to understand the user's current context.
2.  **Proactive Assistance**: Instead of waiting for commands, PhillOS anticipates intent, providing information, tools, or automation proactively.
3.  **Adaptive UI/UX**: The interface is dynamically fluid, adjusting layouts, information presentation, and interaction methods (touch, mouse, keyboard, voice, gestures) based on context and device.
4.  **Personalized Learning**: The AI refines its understanding of the individual user over time, becoming progressively more accurate and helpful.
5.  **Privacy-First Design**: Users have granular control over data collection and usage, with transparent opt-outs and prioritization of local AI models for sensitive data.

## The "Living Glass" Design

The "Living Glass" aesthetic is central to PhillOS's identity, emphasizing:
- **Ethereal Translucency**: Achieved with low-opacity backgrounds and heavy backdrop blurs (`backdrop-blur-3xl`) for a frosted glass effect.
- **Tactile Depth**: UI elements appear to float, with subtle borders (`border-white/10`) and custom inner shadows (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.04),inset_0_0_10px_rgba(192,132,252,0.12)]`) simulating light refraction.
- **Meaningful Motion**: Hover effects, transitions, and custom animations (`animate-pulse-slow`, `animate-bounce-slow`) make the OS feel alive and responsive.
- **Responsive Adaptation**: The UI seamlessly transitions from mobile to desktop, maintaining clarity and the "Living Glass" hierarchy.
- **Vibrant Accents**: Lucide React icons with carefully chosen colors enhance visual appeal and clarity.

## Technology Stack

-   **React 19**: For building the dynamic and component-based user interface.
-   **TypeScript**: For static typing, enhancing code quality and developer experience.
-   **Tailwind CSS**: A utility-first CSS framework for rapid and responsive UI development, enabling the "Living Glass" aesthetic.
-   **Lucide React**: For a comprehensive suite of clean, modern, and customizable SVG icons.
-   **@google/genai** and **openai**: Cloud AI providers used by the AI CoPilot widget when cloud mode is enabled.
-   **React Router (v6, HashRouter)**: For client-side navigation within the single-page application.

## Current Prototype Features

This prototype implements the following features from the PhillOS vision:

-   **Responsive "Living Glass" UI Shell**:
    -   Dynamic Status Bar displaying system information and time.
    -   Adaptive navigation: Desktop Dock and Mobile Bottom Navigation Bar.
-   **Home Dashboard**:
    -   "Strata" system for organizing widgets into logical groups.
    -   **AI CoPilot Widget**: Real-time chat using Gemini or ChatGPT, demonstrating AI interaction.
    -   **User Profile Widget**: Displays username and avatar selected during onboarding.
    -   **AIShadowSearch Widget**: Mocked semantic search across system and web.
    -   **ContextStream Widget**: Mocked display of proactive AI suggestions and contextual information.
    -   Other widgets (System Health, Quick Actions, Gaming Mode, Personalized News) with mocked data or basic interactivity.
-   **In-depth Onboarding Experience**:
    -   Multi-step guided setup: Welcome, AI Model Choice (Local-First vs. Cloud-Enhanced), Privacy Overview, User Profile creation (username, avatar selection), AI Preferences & Data Import simulation, and a PhillOS Core Concepts Tour.
    -   Persistence of onboarding choices in `localStorage`.
-   **Conversational Settings Interface**: A chat-like UI for settings, currently with mocked AI responses to demonstrate the interaction pattern.
-   **Placeholder App Views**: For conceptual applications like Files, Mail, and Gaming, indicating future development areas.
-   **API Key Handling**: Users provide their own API keys for Gemini or ChatGPT directly in the UI.

## Using Cloud AI Providers

PhillOS can optionally connect to either Google Gemini or OpenAI's ChatGPT for cloud-enhanced AI features. During use, select your preferred provider and supply the API key when prompted. The key is kept only in memory for the active session and is never stored.

1. **Obtain an API Key**
   * Gemini keys are available from [Google AI Studio](https://aistudio.google.com/).
   * ChatGPT keys are available from [OpenAI](https://platform.openai.com/account/api-keys).

2. **Provide the Key at Runtime**
   * When choosing the *Cloud-Enhanced AI* option, a field will appear asking for your key and provider. Enter the key directly in the PhillOS UI. The key is not persisted.

   **Important:** Never share your API key publicly.

## Using a Local Qwen Model via Ollama

PhillOS supports running the AI CoPilot entirely on-device using the Qwen3‑1.7B model. This requires [Ollama](https://ollama.com/) to be installed locally. By default the UI connects to the `qwen3:1.7b` model, but you can override this by setting the `VITE_LOCAL_AI_MODEL` environment variable when building or running the app.

1. **Install Ollama**
    * Follow the instructions for your platform at <https://ollama.com/download> and ensure `ollama` is available on your `PATH`.
2. **Prepare the Qwen model**
    * Run `./scripts/setup-ollama.sh` to download `qwen3:1.7b` and start `ollama serve`. Pass a model name as the first argument to use a different one.
    * If you pulled a model with a different name, set `VITE_LOCAL_AI_MODEL` to that name when building or running the app.

After the initial download PhillOS can function entirely offline. When you choose the *Local-First AI* option during onboarding, the CoPilot widget will use this local model and no API key is required.

## Cloud Sync

PhillOS can keep your settings in sync with a remote service. Select the backend by setting `VITE_CLOUD_SYNC_BACKEND` to `webdav`, `s3`, or `api`. Each backend requires different configuration:

### WebDAV

- `VITE_WEBDAV_URL` – base URL where `settings.json` will be stored
- `VITE_WEBDAV_USERNAME` and `VITE_WEBDAV_PASSWORD` – credentials for Basic Auth

### Amazon S3 or compatible

- `VITE_S3_URL` – full object URL (can be presigned)
- `VITE_S3_AUTH_HEADER` – optional Authorization header value

### Self‑hosted API

- `VITE_SYNC_API_URL` – endpoint that returns and accepts settings JSON
- `VITE_SYNC_API_TOKEN` – optional bearer token for authentication

Enable or disable Cloud Sync from the Settings panel. Changes are queued locally while offline and pushed automatically once a connection is available.

## Cross‑Device Awareness

PhillOS detects whether it is running on a phone, desktop, Steam Deck or a VR capable browser.
The `useDeviceType` hook now also tracks orientation and basic input capabilities. It inspects the user agent, WebXR support, current screen orientation and connected gamepads to classify the environment.
Navigation components adjust icon sizes and spacing automatically. When running on a Steam Deck or in VR, the Dock is displayed vertically along the left edge with larger icons. Desktop users see the traditional centered Dock, while mobile devices continue to use the bottom navigation bar.
Game controllers can navigate these elements with the arrow keys or D‑pad and benefit from increased padding for easier selection.

## Voice Interaction

PhillOS includes optional voice input and output for the AI CoPilot. The widget features a microphone button that toggles speech recognition using the browser's built-in Web Speech API. When enabled, spoken phrases are transcribed into the chat input field. After the model responds, the reply is read aloud using speech synthesis.

Most modern browsers support these APIs, but they may require an HTTPS context and user permission. If voice features are unavailable, the microphone button will have no effect.

## Theme Switching

PhillOS now includes a simple theme system with **light** and **dark** modes. The current theme is saved to `localStorage` so your preference persists across sessions. Components automatically adapt their colors based on this setting.

To toggle the theme, call the `useTheme` hook anywhere in the app or add a small switch component that invokes `toggleTheme()` from the context.

## Getting Started

1.  **Prerequisites**:
    *   Node.js and npm.
    *   A modern web browser (Chrome, Firefox, Edge, Safari).
    *   Build tools for the bootloader (`make`, `x86_64-elf-gcc`, `binutils`, `gnu-efi`, `dosfstools`, `mtools`, `grub-mkrescue`).

2.  **Clone the Repository** (if applicable, otherwise download the files):
    ```bash
    # If this were a git repository:
    # git clone <repository-url>
    # cd <repository-name>
    ```
    For the current setup, ensure all provided files (`index.html`, `index.tsx`, `App.tsx`, `types.ts`, `metadata.json`, and the `components/`, `hooks/`, `services/` directories) are in the same project folder.

3.  **Run the Application**:
    *   **Option A (Simple Static Server):**
        You can use any simple HTTP server. If you have Node.js:
        1.  Open your terminal in the project's root directory.
        2.  Install `serve` globally if you haven't: `npm install -g serve`
        3.  Run: `serve .`
        4.  Open your browser to the URL provided (usually `http://localhost:3000` or `http://localhost:5000`).
        *Alternatively, use a browser extension like "Live Server" for VS Code.*
    *   **Option B (Recommended for full `process.env` support - requires adapting to a Vite project):**
        1.  In a new directory, initialize a Vite project: `npm create vite@latest phillos-vite-wrapper -- --template react-ts`
        2.  `cd phillos-vite-wrapper`
        3.  Replace the contents of the `src` directory and the root `index.html` in `phillos-vite-wrapper` with the files from this PhillOS prototype. Adjust paths in `index.html` if necessary.
        4.  Run `npm install && npm run dev`.

5.  **Explore PhillOS**:
    *   You will be guided through the new, in-depth onboarding process.
    *   Interact with the dashboard widgets and navigation. Experience the "Living Glass" aesthetic.

## Building the Bootloader & Kernel

PhillOS ships with a minimal bootloader and kernel written in C. Building them
requires a cross&#8209;compiler and EFI development libraries. See
[docs/building.md](docs/building.md) for detailed setup instructions.

### Required Packages

Building the bootloader uses a cross‑compiler and several utilities:

* `make`
* `x86_64-elf-gcc` (cross compiler)
* `binutils`
* `gnu-efi`
* `dosfstools` (for `mkfs.fat`)
* `mtools` (for `mcopy`/`mmd`)
* `grub-mkrescue`

The exact package names vary by distribution:

```bash
# Debian/Ubuntu
sudo apt install build-essential make mtools dosfstools \
    grub-efi-amd64-bin grub-common binutils gnu-efi
# build or install a cross compiler (many guides use an x86_64-elf-gcc build script)

# Arch Linux
sudo pacman -S make mtools dosfstools grub x86_64-elf-gcc \
    x86_64-elf-binutils gnu-efi

# Fedora
sudo dnf install make mtools dosfstools grub2-tools \
    x86_64-elf-gcc binutils gnu-efi
```

After installation confirm the cross compiler is available:

```bash
x86_64-elf-gcc --version
```

### Build Steps

Use the top‑level build script to compile the bootloader/kernel and the web
interface in one step. Artifacts are written to the common `dist/` directory:

```bash
./scripts/build.sh
```

Internally this runs `make -C bootloader` and `npm run build`. Bootloader files
land in `dist/bootloader` and the UI build is placed directly in `dist/`.
To generate an ISO, run `make -C bootloader OUT_DIR=../dist/bootloader iso`.

### Writing the ISO to a USB Drive

Once the ISO image (`dist/bootloader/phillos.iso`) is generated you can flash it
to a USB stick.  On Linux and macOS the simplest method is the `dd` utility:

```bash
sudo dd if=dist/bootloader/phillos.iso of=/dev/sdX bs=4M status=progress && sync
```

Replace `/dev/sdX` with the device node for your USB drive (e.g. `/dev/sdb`).
Windows users can use **Rufus** and Linux/macOS users may prefer **balenaEtcher**
for a graphical experience.

### UEFI/BIOS Settings

PhillOS currently targets UEFI systems.  Disable Secure Boot if your firmware
does not allow booting unsigned images and ensure "UEFI only" (or CSM off) is
selected.  Use the boot menu key (often `F12` or `Esc`) to choose the USB device
if it does not boot automatically.

### Troubleshooting Boot Issues

- **Bootloader not found:** verify the USB was flashed correctly and that you
  selected the correct device in the boot menu.
- **Black screen or immediate reboot:** ensure UEFI boot is enabled and Secure
  Boot is disabled.
- **USB not detected:** try another port or recreate the USB stick with a fresh
  download of the ISO.

### Running in QEMU

You can test the image using QEMU's UEFI firmware:

```bash
qemu-system-x86_64 -drive format=raw,file=fat:rw:dist/bootloader \
  -bios /usr/share/OVMF/OVMF_CODE.fd
```

This starts QEMU with the generated EFI file as the boot volume.

### AHCI Storage Driver

The kernel contains a very small AHCI driver used only during early boot.  It
initializes the first detected SATA port and supports basic DMA reads and
writes.  Buffers passed to the read/write helpers must reside in identity mapped
physical memory.  Only simple single-page transfers are currently tested.

## Offline Installation and Usage

PhillOS can run without an internet connection once the UI files are cached by the service worker.

1. Build the project and generate the ISO as described above, then flash it to a USB stick.
2. Boot from the USB drive. The browser loads all core assets and API responses into the cache so subsequent boots work completely offline.
3. Alternatively serve the contents of the `dist/` folder from a local web server:

```bash
npx serve dist
```

Visit the local URL on your network once to cache the files. After that the OS continues to function even if the server goes offline. Rebuild the project and replace the files on the USB or server to update.

## Project Structure

```
/
├── components/
│   ├── onboarding/       # Onboarding flow steps
│   │   ├── AIModelStep.tsx
│   │   ├── AIPreferencesSurveyStep.tsx
│   │   ├── GuidedTourStep.tsx
│   │   ├── OnboardingStepper.tsx
│   │   ├── PrivacyStep.tsx
│   │   ├── UserProfileStep.tsx
│   │   └── WelcomeStep.tsx
│   ├── settings/         # Settings components
│   │   └── ConversationalSettingsView.tsx
│   ├── widgets/          # Dashboard widgets
│   │   ├── AICoPilotWidget.tsx
│   │   ├── AIShadowSearchWidget.tsx
│   │   ├── ContextStreamWidget.tsx
│   │   ├── GamingModeWidget.tsx
│   │   ├── PersonalizedNewsWidget.tsx
│   │   ├── QuickActionsWidget.tsx
│   │   ├── SystemHealthWidget.tsx
│   │   └── UserProfileWidget.tsx
│   ├── Dock.tsx
│   ├── GlassCard.tsx
│   ├── HomeDashboard.tsx
│   ├── MobileBottomNavigationBar.tsx
│   ├── PlaceholderAppView.tsx
│   └── StatusBar.tsx
├── hooks/
│   ├── useOnboarding.ts    # Manages onboarding state & logic
│   └── useResponsive.ts    # Handles responsive layout changes
├── services/
│   └── cloudAIService.ts   # Gemini or ChatGPT integration logic
├── App.tsx                 # Main application component, routing
├── index.html              # Root HTML file
├── index.tsx               # React entry point
├── metadata.json           # Project metadata
├── types.ts                # TypeScript type definitions
└── README.md               # This file
```

## Key Architectural Components

-   **`App.tsx`**: The main application component. It handles routing, global layout, and conditionally renders UI chrome (Status Bar, Navigation) based on the onboarding status.
-   **`useOnboarding.ts`**: A custom React hook responsible for managing the multi-step onboarding process, persisting state to `localStorage`, and providing helper functions.
-   **`OnboardingStepper.tsx`**: Orchestrates the various steps of the user onboarding experience, dynamically rendering the current step.
-   **`GlassCard.tsx`**: A reusable presentational component that implements the core "Living Glass" visual style (translucency, blur, custom shadows), applied to most UI panes.
-   **`HomeDashboard.tsx`**: Renders the main dashboard layout, utilizing a "Strata" system to organize different categories of widgets.
-   **`AICoPilotWidget.tsx`**: A key interactive widget that integrates with `cloudAIService.ts` to provide chat via Gemini or ChatGPT.
-   **`cloudAIService.ts`**: Handles communication with the selected cloud AI provider.

## Future Vision (Conceptual)

This prototype serves as a visual and interactive demonstration of the PhillOS concept. See [docs/Blueprint.md](docs/Blueprint.md) for the broader roadmap and [docs/building.md](docs/building.md) for toolchain setup. More docs will appear in the `docs/` directory.

-   An **AI-Native Kernel** for dynamic resource allocation, intelligent process scheduling, and proactive self-healing.
-   **Deep OS-level AI integration** across all applications and system functions, enabling true ambient intelligence.
-   **Advanced Gaming Optimizations** with AI-managed compatibility layers (Winery, Proton, DX12) for seamless performance.
-   **Fully functional Smart Core Applications** (Web Browser, Mail, Files, Photos) with deep AI enhancements for summarization, organization, and contextual actions.
-   **Intelligent Lock Screen** with dynamically displayed relevant information, smart notifications, and advanced multi-modal biometrics.
-   **True Conversational Settings** allowing users to configure the OS using natural language, powered by AI.
-   Robust **Security AI** with real-time threat detection, adaptive firewalls, and secure enclaves.
-   And much more, all aiming to create a truly personalized, efficient, and engaging computing experience that learns and adapts to the user.

## Android Container (Experimental)

PhillOS can run Android apps inside a [Waydroid](https://waydro.id/) container. The
`android` directory now includes a functional controller script and a helper
script for installing **microG** so the Play Store works inside the container.

### Prerequisites

- Linux system with Waydroid and `adb` installed

### Running

1. Start the container and attach the display bridge:

   ```bash
   ts-node android/controller.ts start
   ```

2. (Optional) Install microG packages:

   ```bash
   ./android/setup-microg.sh
   ```

   Reboot the container after the script finishes and sign in to the Play Store.

3. Stop the container when finished:

   ```bash
   ts-node android/controller.ts stop
   ```

See [android/README.md](android/README.md) for additional details.

## DirectX 12 on Vulkan

PhillOS uses the open source **vkd3d-proton** layer to translate DirectX 12 calls into Vulkan. During boot the kernel initializes this library after detecting the GPU vendor so both native applications and Proton/Wine games can run without network access. See [docs/vkd3d.md](docs/vkd3d.md) for setup instructions.

## Proton Launcher

The backend includes a small server that can start Windows executables through Proton. It first looks for a bundled Proton build under `dist/proton/<version>/`. If the directory is missing the launcher will attempt to download the archive defined by the `PROTON_DOWNLOAD_URL` environment variable. When Proton cannot be located, it falls back to using Wine.

Start the server with:

```bash
npm run server
```

In the UI open the **Proton Launcher** widget, supply the executable path and Proton version, and optionally check **Use Wine if Proton missing**.

## PWA Cache Management

PhillOS now ships with a basic service worker. If you make changes to the UI and deploy a new build, your browser may continue using cached files until the service worker updates.

To force the latest version:

1. Open the browser's dev tools and navigate to **Application → Service Workers**.
2. Click **Unregister** or check **Update on reload** and refresh the page.
3. Alternatively, clear site data to remove all cached files.
4. You can also open the *Offline & Updates* widget on the dashboard and use the **Check for Updates** or **Clear Cache** buttons.

## Phone Hardware Requirements & Usage

Basic phone integration requires the following hardware:

- SIM card slot connected to a compatible modem
- Bluetooth 4.0 or newer controller

The drivers under `drivers/phone/` are only stubs. Building the OS with these files included will not enable real phone functionality yet, but a Node service in `services/phoneBridge/` can relay calls, SMS and notifications from a paired phone. Start it with:

```bash
npm run phone-bridge
```

Enter your phone's Bluetooth MAC address in the **Phone Status** widget and press **Connect**. The service relies on `bluetoothctl` so you can also pair manually. Once paired the bridge works entirely offline over the local Bluetooth link.

## License

This project is licensed under the [MIT License](LICENSE).
