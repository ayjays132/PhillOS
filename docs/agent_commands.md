# Triggering PhillOS Actions via Natural Language

The agent orchestrator exposes a set of actions registered by system services. When you speak or type a request, the agent parses it into a structured intent referencing one of these actions. A few examples are listed below.

| Example command | Resulting intent |
| ---------------- | --------------- |
| "Open the files app" | `{ "action": "open_app", "parameters": {"app": "files"} }` |
| "Add a calendar entry tomorrow at 9" | `{ "action": "timeai.add_event", "parameters": {"title": "...", "time": "..."} }` |
| "Send a text to Tom saying I'll be late" | `{ "action": "phone.send_sms", "parameters": {"to": "Tom", "body": "I'll be late"} }` |

The orchestrator then invokes the corresponding service method. Use conversational phrases and the agent will map them onto these actions automatically.
