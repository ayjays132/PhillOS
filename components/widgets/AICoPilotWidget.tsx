
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, AlertTriangle, Loader2 } from 'lucide-react';
import { ChatMessage } from '../../types';
import { createChatSession, sendMessageToChatStream } from '../../services/geminiService';
import { createQwenChatSession, QwenChatSession } from '../../services/qwenService';
import type { Chat, GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useOnboarding } from '../../hooks/useOnboarding';

export const AICoPilotWidget: React.FC = () => {
  const { modelPreference } = useOnboarding();
  const [chatSession, setChatSession] = useState<Chat | QwenChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  useEffect(() => {
    if (modelPreference === 'cloud') {
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.length < 10) {
        setIsApiKeyMissing(true);
        setError('Gemini API Key is missing or invalid. Please configure it to use the AI CoPilot.');
        return;
      }

      const session = createChatSession();
      if (session) {
        setChatSession(session);
        setMessages([
          { id: 'initial-greeting', role: 'model', text: 'Hello! I am PhillOS CoPilot. How can I assist you today?', timestamp: new Date() }
        ]);
      } else {
        setError('Failed to initialize AI CoPilot session. Make sure your API key is correctly set up.');
        setIsApiKeyMissing(true);
      }
    } else {
      const session = createQwenChatSession();
      setChatSession(session);
      setMessages([
        { id: 'initial-greeting', role: 'model', text: 'Hello! I am PhillOS CoPilot. How can I assist you today?', timestamp: new Date() }
      ]);
    }
  }, [modelPreference]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !chatSession) return;
    if (modelPreference === 'cloud' && isApiKeyMissing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const stream = modelPreference === 'cloud'
        ? await sendMessageToChatStream(chatSession as Chat, userMessage.text)
        : (chatSession as QwenChatSession).sendMessageStream(userMessage.text);

      if (!stream) {
        throw new Error('Failed to get response stream from AI.');
      }
      
      let modelResponseText = '';
      const modelMessageId = Date.now().toString() + '-model';
      
      // Add a placeholder for the model's response
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', timestamp: new Date() }]);

      for await (const chunk of stream) {
        const chunkText = modelPreference === 'cloud'
          ? (chunk as GenerateContentResponse).text
          : (chunk as string);
        if (chunkText) {
          modelResponseText += chunkText;
          setMessages(prev => prev.map(msg =>
            msg.id === modelMessageId ? { ...msg, text: modelResponseText } : msg
          ));
        }
      }
      // Final update to ensure the message text is complete (though usually handled by loop)
       setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: modelResponseText } : msg
        ));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error("AI CoPilot Error:", err);
      setError(`Error: ${errorMessage}. Please check your API key and network connection.`);
      setMessages(prev => [...prev, { id: Date.now().toString() + '-error', role: 'system', text: `Error: ${errorMessage}`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chatSession, isApiKeyMissing, modelPreference]);

  if (modelPreference === 'cloud' && isApiKeyMissing && !messages.some(msg => msg.id === 'initial-greeting')) {
     return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <AlertTriangle size={48} className="text-red-400 mb-4" />
            <p className="text-lg font-semibold text-red-300">AI CoPilot Unavailable</p>
            <p className="text-sm text-white/70">
                Gemini API Key is missing or invalid. Please set the <code>process.env.API_KEY</code> environment variable.
            </p>
        </div>
    );
  }


  return (
    <div className="flex flex-col h-[350px] sm:h-[400px] md:h-[450px] bg-black/20 rounded-lg overflow-hidden">
      <div className="flex-grow p-3 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-2.5 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-purple-600/70 text-white' : 
                msg.role === 'model' ? 'bg-slate-700/60 text-white/90' : 
                'bg-red-500/50 text-white' // System/Error message
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside my-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside my-1" {...props} />,
                li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                     <pre className="bg-black/30 p-2 rounded-md my-1 overflow-x-auto text-xs"><code className={className} {...props}>{children}</code></pre>
                  ) : (
                    <code className="bg-black/30 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
                  )
                },
                a: ({node, ...props}) => <a className="text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
              }}>
                {msg.text}
              </ReactMarkdown>
              <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-200/70 text-right' : 'text-slate-400/70'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {error && <p className="p-2 text-xs text-red-400 bg-red-900/30 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 flex items-center gap-2 bg-black/10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={modelPreference === 'cloud' && isApiKeyMissing ? 'API Key missing...' : 'Ask PhillOS CoPilot...'}
          className="flex-grow p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/80 transition-shadow duration-200 focus:shadow-[0_0_15px_rgba(56,189,248,0.3)] disabled:opacity-50"
          disabled={isLoading || (modelPreference === 'cloud' && isApiKeyMissing)}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim() || (modelPreference === 'cloud' && isApiKeyMissing)}
          className="p-2.5 bg-purple-600/80 hover:bg-purple-500/80 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/80 hover:scale-105"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};
