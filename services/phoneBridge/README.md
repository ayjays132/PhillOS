# Phone Bridge Service

This Node.js service relays SMS messages, phone calls and notifications between PhillOS and a paired phone. It communicates with the main backend over HTTP and uses Bluetooth for the phone link so it can run completely offline once paired.

## Prerequisites

- `bluetoothctl` must be available in `PATH` for pairing and connection management.
- A modem device accessible as `/dev/ttyUSB0` or similar is required for SMS and call commands. Override the path with `MODEM_DEVICE=/dev/yourmodem` when starting the service.

## Building `libphone`

The bridge loads a small native helper library for SIM and Bluetooth utilities. Build it from the project root:

```bash
make -C drivers/phone
cp drivers/phone/libphone.so .
```

The library should sit in the project root (next to `package.json`) because the
service loads `./libphone` relative to the working directory when started via
`npm run phone-bridge`.

## Running Offline

Start the bridge with the provided npm script:

```bash
npm run phone-bridge
```

Set `PHONE_BRIDGE_PORT` to change the listening port. Once your phone is paired (manually or through the UI) all communication is local and does not require internet access.

## Testing with a Paired Phone

Use the **Phone Status** widget in the web UI or send requests directly. Example `curl` commands:

```bash
# Send an SMS
curl -X POST http://localhost:3002/sms -d '{"to":"+12345550123","body":"Hello"}' \
     -H 'Content-Type: application/json'

# Initiate a call
curl -X POST http://localhost:3002/call -d '{"number":"+12345550123"}' \
     -H 'Content-Type: application/json'
```

Successful requests return `{ "success": true }` and the **Phone Status** widget updates to show the current SMS or call state.
