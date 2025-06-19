import React, { useState } from "react";
import { GlassCard } from "./GlassCard";
import { phoneService } from "../services/phoneService";
import { usePhone } from "../contexts/PhoneContext";
import { createQwenChatSession } from "../services/qwenService";
import {
  createCloudChatSession,
  sendMessageStream,
  CloudProvider,
} from "../services/cloudAIService";
import { useOnboarding } from "../hooks/useOnboarding";

const PhoneApp: React.FC = () => {
  const { modelPreference } = useOnboarding();
  const { status, connect, disconnect, lastAddress } = usePhone();
  const [address, setAddress] = useState(lastAddress);
  const [smsTo, setSmsTo] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>("gemini");
  const [apiKey, setApiKey] = useState("");

  const toggle = () => {
    if (status.connected) {
      disconnect();
    } else if (address) {
      connect(address);
    }
  };

  const sendSms = async () => {
    if (!smsTo || !smsBody) return;
    await phoneService.sendSms({ to: smsTo, body: smsBody });
    setSmsBody("");
  };

  const dial = async () => {
    if (!number) return;
    await phoneService.makeCall(number);
  };

  const suggest = async () => {
    setLoading(true);
    try {
      let text = "";
      if (modelPreference === "cloud") {
        if (!apiKey) throw new Error("API key required for cloud AI");
        const session = await createCloudChatSession(cloudProvider, apiKey);
        if (!session) throw new Error("Failed to initialize cloud AI session");
        for await (const chunk of sendMessageStream(
          session,
          `Compose a short SMS: ${smsBody || ""}`,
        )) {
          text += chunk;
        }
      } else {
        const session = await createQwenChatSession();
        for await (const chunk of session.sendMessageStream(
          `Compose a short SMS: ${smsBody || ""}`,
        )) {
          text += chunk;
        }
      }
      setSmsBody(text.trim());
    } catch (err) {
      console.error("Suggestion failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="!shadow-2xl !shadow-blue-600/30 !border-white/15 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm">
            {status.connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!status.connected && (
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="MAC"
              className="bg-transparent text-xs border border-white/20 rounded px-1 w-24"
            />
          )}
          <button
            onClick={toggle}
            className="text-xs px-2 py-1 bg-white/10 rounded text-white/80"
          >
            {status.connected ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {modelPreference === "cloud" && (
          <div className="flex items-center gap-2">
            <select
              value={cloudProvider}
              onChange={(e) =>
                setCloudProvider(e.target.value as CloudProvider)
              }
              className="bg-white/10 border border-white/20 text-xs text-white px-1 py-0.5 rounded"
            >
              <option value="gemini">Gemini</option>
              <option value="openai">ChatGPT</option>
            </select>
            <input
              type="password"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-grow px-1 py-0.5 bg-white/5 border border-white/10 rounded text-xs placeholder-white/40"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={smsTo}
            onChange={(e) => setSmsTo(e.target.value)}
            placeholder="To"
            className="bg-transparent text-sm border border-white/20 rounded px-2 flex-1"
          />
          <button
            onClick={suggest}
            className="text-xs px-2 py-1 bg-white/10 rounded text-white/80"
          >
            {loading ? "..." : "Suggest"}
          </button>
        </div>
        <textarea
          value={smsBody}
          onChange={(e) => setSmsBody(e.target.value)}
          placeholder="Message"
          className="bg-transparent text-sm border border-white/20 rounded px-2 py-1 w-full h-24"
        />
        <button
          onClick={sendSms}
          className="w-full text-xs px-2 py-1 bg-white/20 rounded text-white/80"
        >
          Send SMS
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Number"
          className="bg-transparent text-sm border border-white/20 rounded px-2 w-full"
        />
        <button
          onClick={dial}
          className="w-full text-xs px-2 py-1 bg-white/20 rounded text-white/80"
        >
          Call
        </button>
      </div>
    </GlassCard>
  );
};

export default PhoneApp;
