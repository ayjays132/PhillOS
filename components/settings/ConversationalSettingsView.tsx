
import React, { useState, useRef, useEffect } from 'react';
import { Settings, Send, MessageSquare, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../GlassCard';
import { CloudSyncToggle } from "./CloudSyncToggle";

interface SettingsMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export const ConversationalSettingsView: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<SettingsMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: SettingsMessage = { 
      id: Date.now().toString(), 
      text: input, 
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Mock AI response
    setTimeout(() => {
      const aiResponse: SettingsMessage = {
        id: (Date.now() + 1).toString(),
        text: `PhillOS is processing your settings query: "${userMessage.text}". This feature is currently a conceptual demonstration. In a full implementation, I would adjust settings or provide information based on your request. For now, imagine I've understood and acted upon it!`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <GlassCard className="!shadow-2xl !shadow-blue-600/30 !border-white/15 h-full flex flex-col !p-0 overflow-hidden">
      <div className="flex items-center p-4 border-b border-white/10 bg-black/5 sticky top-0 z-10">
        <Settings size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Conversational Settings</h1>
        <div className="ml-auto">
          <CloudSyncToggle />
        </div>
      </div>

      <div className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/60 p-6">
            <MessageSquare size={56} className="mb-6 opacity-40" />
            <h2 className="text-xl font-semibold mb-2">Welcome to Smart Settings</h2>
            <p className="text-base mb-1">Tell PhillOS what you want to configure or find.</p>
            <p className="text-sm">For example: "Dark mode", "Change wallpaper", "Notification preferences"</p>
            <p className="mt-4">
              <Link to="/settings/phone" className="text-cyan-300 hover:underline">
                Phone Settings
              </Link>
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-xl text-sm leading-relaxed shadow-md flex flex-col
                ${msg.sender === 'user' 
                  ? 'bg-purple-600/80 text-white rounded-br-none' 
                  : 'bg-slate-700/70 text-white/95 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <span className={`text-xs mt-1.5 opacity-70 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-[85%] sm:max-w-[75%] p-3 rounded-xl text-sm leading-relaxed shadow-md bg-slate-700/70 text-white/95 rounded-bl-none flex items-center">
                <Bot size={18} className="mr-2 animate-pulse-slow text-cyan-300" />
                <span>PhillOS is thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-white/10 flex items-center gap-2 sm:gap-3 bg-black/10 sticky bottom-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask PhillOS to change a setting..."
          aria-label="Settings command input"
          className="flex-grow p-3 bg-white/5 border border-white/10 rounded-lg text-sm placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/80 transition-shadow duration-200 focus:shadow-[0_0_15px_rgba(56,189,248,0.3)] disabled:opacity-60"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send settings command"
          className="p-3 bg-purple-600/80 hover:bg-purple-500/80 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/80 hover:scale-105"
        >
          {isLoading ? <span className="w-5 h-5 block border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <Send size={20} />}
        </button>
      </form>
    </GlassCard>
  );
};
