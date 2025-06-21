# Agent Mode Walkthrough

PhillOS includes an Agent orchestrator that connects your apps and services. This document shows how to start the agent, register actions and coordinate multiple apps in one workflow.

## Starting the Agent

Run the core agent process from the project root:

```bash
npx phillos agent start
```

This launches the Node and Python helpers that power the orchestrator. Leave this running in a separate terminal while you test commands.

## Registering Actions

Services register actions with the agent so your requests can be routed automatically. Each service exposes a small API. For example the Vault service registers `vault.smartTags` and `vault.list` while the Inbox service provides `inbox.send`.

When the agent starts it loads all available services and stores their actions. You can view example commands that map to these actions in [docs/agent_commands.md](agent_commands.md).

## Orchestrating Multiple Apps

The agent can chain actions from different services to accomplish a high‑level goal. A request like "Add tomorrow's meeting and email the invite" will be parsed into two intents:

```json
{ "action": "timeai.add_event", "parameters": { "title": "Team Meeting", "time": "tomorrow" } }
```

followed by

```json
{ "action": "inbox.send", "parameters": { "body": "Inviting you to our meeting" } }
```

These intents are executed in sequence so the calendar entry is created and the email composed automatically.

Use conversational language—the agent maps your words onto registered actions. The examples in [docs/agent_commands.md](agent_commands.md) show additional phrases.

Once you are comfortable with the flow you can begin crafting more complex requests that touch multiple apps. The orchestrator ensures data flows between them and reports progress back in the console.
