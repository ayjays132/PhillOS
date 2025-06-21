# Configuring AI Providers

PhillOS supports both local models and cloud services. Choose the mode that suits your privacy and performance needs.

## Local AI with Ollama

1. Install [Ollama](https://ollama.com/) and start the daemon:
   ```bash
   ./scripts/setup-ollama.sh
   ```
2. The default model is `qwen3:1.7b`. Override it by setting `VITE_LOCAL_AI_MODEL` in your `.env` file:
   ```bash
   VITE_LOCAL_AI_MODEL=my-model
   ```
3. Select **Local-First AI** during onboarding. No API key is required and the CoPilot communicates with the running Ollama server.

## Cloud Providers

If you prefer Gemini or ChatGPT, choose **Cloud-Enhanced AI** and supply the provider key when prompted.

Example commands for the agent CLI:
```bash
npx phillos agent start --cloud --provider gemini --api-key YOUR_GEMINI_KEY
npx phillos agent start --cloud --provider openai --api-key YOUR_OPENAI_KEY
```
The keys are kept only for the duration of the session.
