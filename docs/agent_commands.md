# Triggering PhillOS Actions via Natural Language

The agent orchestrator exposes a set of actions registered by system services. When you speak or type a request, the agent parses it into a structured intent referencing one of these actions. A few examples are listed below.

| Example command | Resulting intent |
| ---------------- | --------------- |
| "Open the files app" | `{ "action": "open_app", "parameters": {"app": "files"} }` |
| "Add a calendar entry tomorrow at 9" | `{ "action": "timeai.add_event", "parameters": {"title": "...", "time": "..."} }` |
| "Send a text to Tom saying I'll be late" | `{ "action": "phone.send_sms", "parameters": {"to": "Tom", "body": "I'll be late"} }` |

The orchestrator then invokes the corresponding service method. Use conversational phrases and the agent will map them onto these actions automatically.

## Available actions

The table below lists some notable actions exposed by the core services. The prefix corresponds to the service name.

| Action | Description |
| ------ | ----------- |
| `vault.smartTags` | Generate SmartTags for the given file path |
| `vault.list` | List directory contents |
| `timeai.add_event` | Add a calendar entry |
| `inbox.send` | Send an email message |
| `phone.send_sms` | Send an SMS message |
| `predict.recent_files` | Get recently used file list |
| `snapshot.rollback` | Revert to previous app snapshot |

### Example

Running SmartTags on a document then emailing the tags would result in two intents:

```json
{ "action": "vault.smartTags", "parameters": { "path": "notes.txt" } }
```

Once completed the router triggers:

```json
{ "action": "inbox.send", "parameters": { "body": "tag1, tag2" } }
```
