import { useState } from "react";
import { ChatSession, VoiceOption, PRESET_VOICES } from "../types";
import {
  Plus,
  MessageSquare,
  Trash2,
  Globe,
  Volume2,
  Bot,
  Check,
  Edit2,
  CheckCheck,
  X,
  Compass,
  Sparkles,
  Code2,
  PenTool,
  BarChart2,
  Brain,
  Gauge,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  enableSearch: boolean;
  onToggleSearch: (val: boolean) => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  selectedPersona: string;
  onSelectPersona: (persona: string) => void;
  temperature: number;
  onChangeTemperature: (temp: number) => void;
  thinkingLevel: string;
  onChangeThinkingLevel: (lvl: string) => void;
  userEmail?: string;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onClearAll,
  selectedModel,
  onSelectModel,
  enableSearch,
  onToggleSearch,
  selectedVoice,
  onSelectVoice,
  selectedPersona,
  onSelectPersona,
  temperature,
  onChangeTemperature,
  thinkingLevel,
  onChangeThinkingLevel,
  userEmail = "rajeevreddyakepati@gmail.com",
}: SidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);

  const startRename = (id: string, currentTitle: string) => {
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  return (
    <aside className="w-80 bg-black/20 backdrop-blur-2xl border-r border-white/5 flex flex-col h-full text-slate-200 z-10">
      {/* Sidebar Header with Premium Nova Branding */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Nova AI
            </h1>
            <p className="text-xs font-mono text-slate-500">Premium Assistant</p>
          </div>
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="px-4 py-3">
        <button
          onClick={onCreateSession}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 active:bg-white/5 text-slate-100 rounded-xl font-medium transition-all duration-200 text-sm shadow-sm hover:shadow-md cursor-pointer group"
        >
          <Plus className="w-4 h-4 text-violet-400 group-hover:rotate-90 transition-transform duration-300" />
          New Chat
        </button>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 tracking-wider flex items-center justify-between">
          <span>Recent Conversations</span>
          <span className="bg-white/5 border border-white/5 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono">
            {sessions.length}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-650 text-xs flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 text-slate-800 stroke-[1.5]" />
              <p>No chat history yet</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingSessionId;

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 border border-white/10 text-white shadow-sm"
                      : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full p-2 pl-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveRename(session.id)}
                        className="bg-[#0c0c12] border border-white/10 rounded px-2 py-1 text-sm text-slate-100 flex-1 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveRename(session.id)}
                        className="p-1 hover:text-emerald-400 transition"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingSessionId(null)}
                        className="p-1 hover:text-rose-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full p-2.5 pl-3">
                      <button
                        onClick={() => onSelectSession(session.id)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <div className={`w-2 h-2 rounded-full transition-all shrink-0 ${
                          isActive ? "bg-indigo-400 animate-pulse" : "border border-slate-600"
                        }`} />
                        <span className="text-sm font-medium truncate pr-8">{session.title}</span>
                      </button>

                      {/* Action buttons on Hover */}
                      <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150 bg-black/40 group-hover:bg-transparent rounded px-1">
                        <button
                          onClick={() => startRename(session.id, session.title)}
                          className="p-1 text-slate-500 hover:text-slate-200 transition"
                          title="Rename Chat"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Configuration Panel - Custom Persona, Model, Search, Temperature & Thinking */}
      <div className="p-4 border-t border-white/5 bg-black/10 backdrop-blur-md space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {/* System Persona Section */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-indigo-400" /> Assistant Persona
          </label>
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-white/5 border border-white/5 rounded-lg text-center">
            {[
              { id: "general", label: "Agent", icon: Bot, tooltip: "Balanced Assistant" },
              { id: "coder", label: "Coder", icon: Code2, tooltip: "TypeScript Architect" },
              { id: "writer", label: "Writer", icon: PenTool, tooltip: "Creative Novelist" },
              { id: "analyst", label: "Analyst", icon: BarChart2, tooltip: "Objective Analyst" },
            ].map((p) => {
              const isSelected = selectedPersona === p.id;
              const IconComp = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPersona(p.id)}
                  title={p.tooltip}
                  className={`py-1.5 flex flex-col items-center gap-0.5 rounded-md transition duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-white/10 text-indigo-400 border border-white/5 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-350 hover:bg-white/5"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono tracking-tight">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Intelligence Model
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 border border-white/5 rounded-lg">
            {[
              { id: "gemini-3.5-flash", label: "Flash 3.5", desc: "Recommended" },
              { id: "gemini-3.1-pro-preview", label: "Pro 3.1", desc: "Complex logic" },
              { id: "gemini-3.1-flash-lite", label: "Lite 3.1", desc: "Ultra-fast" },
              { id: "gemini-2.5-flash", label: "Stable 2.5", desc: "Stable legacy" },
            ].map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className={`py-1 px-1.5 flex flex-col items-center justify-center rounded-md transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-white/10 text-slate-50 border border-white/10 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <span className="text-xs">{m.label}</span>
                  <span className="text-[8px] opacity-70 scale-90 font-mono">{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Temperature Tuning */}
        <div className="space-y-1 px-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Temp: {temperature.toFixed(1)}
            </span>
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-tight">
              {temperature <= 0.4 ? "Precise" : temperature >= 1.1 ? "Creative" : "Balanced"}
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.1"
            value={temperature}
            onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Reasoning depth (thinkingLevel) */}
        {selectedModel.startsWith("gemini-3") && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-pink-400 animate-pulse" /> Reasoning Depth
            </label>
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-white/5 border border-white/5 rounded-lg text-center">
              {[
                { id: "auto", label: "Auto" },
                { id: "MINIMAL", label: "Min" },
                { id: "LOW", label: "Low" },
                { id: "HIGH", label: "High" },
              ].map((lvl) => {
                const isSelected = thinkingLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => onChangeThinkingLevel(lvl.id)}
                    className={`py-1 text-[10px] font-medium rounded-md transition duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-white/10 text-slate-100 border border-white/5 shadow-sm font-semibold"
                        : "text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Grounding Toggle */}
        <div className="flex items-center justify-between py-1 px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-indigo-950/30 border border-indigo-900/30 flex items-center justify-center">
              <Globe className={`w-4 h-4 ${enableSearch ? "text-indigo-400" : "text-slate-500"}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300">Web Grounding</p>
              <p className="text-[10px] text-slate-500">Real-time sources</p>
            </div>
          </div>
          <button
            onClick={() => onToggleSearch(!enableSearch)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
              enableSearch ? "bg-indigo-600" : "bg-white/10"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                enableSearch ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Text-To-Speech Settings */}
        <div className="relative">
          <button
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-950/30 border border-purple-900/30 flex items-center justify-center">
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">Nova Voice</p>
                <p className="text-[10px] text-slate-500">
                  Active: {PRESET_VOICES.find((v) => v.name === selectedVoice)?.displayName || selectedVoice}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono px-1 border border-white/5 rounded bg-black/40">
              TTS
            </span>
          </button>

          {/* Voice Dropdown Popover */}
          <AnimatePresence>
            {showVoiceSelector && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowVoiceSelector(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full mb-2 left-0 right-0 bg-[#121218] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden"
                >
                  <div className="p-3 border-b border-white/5 bg-black/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Select Speaking Voice</span>
                    <button onClick={() => setShowVoiceSelector(false)}>
                      <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-1.5 space-y-1">
                    {PRESET_VOICES.map((voice) => {
                      const isSelected = voice.name === selectedVoice;
                      return (
                        <button
                          key={voice.name}
                          onClick={() => {
                            onSelectVoice(voice.name);
                            setShowVoiceSelector(false);
                          }}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                            isSelected ? "bg-white/10 border border-white/10" : "hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? "border-indigo-500 bg-indigo-600 text-white" : "border-slate-700"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-200">{voice.displayName}</span>
                              <span className="text-[9px] bg-black/40 border border-white/5 text-slate-500 px-1 rounded-sm uppercase tracking-wider font-mono">
                                {voice.gender}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{voice.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / User Profile & Clear History */}
      <div className="p-4 border-t border-white/5 bg-black/10 backdrop-blur-md flex flex-col gap-2.5">
        <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-3 border border-white/5">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs border border-white/10 select-none font-semibold text-indigo-400 font-mono">
            {userEmail.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-100 truncate">{userEmail}</p>
            <p className="text-[10px] text-indigo-400">Pro Member</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm("Are you sure you want to clear your entire chat history? This cannot be undone.")) {
              onClearAll();
            }
          }}
          className="text-center py-1.5 text-xs text-slate-600 hover:text-rose-450 active:text-rose-500 transition font-medium border border-transparent hover:border-rose-950/30 hover:bg-rose-950/10 rounded-lg cursor-pointer"
        >
          Clear All Conversations
        </button>
      </div>
    </aside>
  );
}
