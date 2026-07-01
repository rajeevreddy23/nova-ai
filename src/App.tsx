import { useState, useEffect } from "react";
import { ChatSession, Message, VoiceOption } from "./types";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";

// Resilient ID generator fallback for sandboxed environments
function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

const STORAGE_KEY = "nova_ai_chat_sessions";

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load chats from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatSession[];
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load sessions from storage:", e);
    }
    
    // Fallback: Create first fresh session
    createFreshSession();
  }, []);

  // Save chats to local storage whenever they change
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save sessions to storage:", e);
    }
  };

  const createFreshSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      model: "gemini-3.5-flash",
      enableSearch: false,
      voice: "Zephyr",
      persona: "general",
      temperature: 1.0,
      thinkingLevel: "auto",
    };
    
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    if (isGenerating) {
      alert("Please wait until Nova AI finishes generating the current response.");
      return;
    }
    setActiveSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    if (isGenerating && id === activeSessionId) {
      alert("Cannot delete the active chat session while a response is being generated.");
      return;
    }
    
    const updated = sessions.filter((s) => s.id !== id);
    saveSessions(updated);

    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        // Automatically create a new one if we cleared everything
        const fresh: ChatSession = {
          id: generateId(),
          title: "New Chat",
          messages: [],
          createdAt: Date.now(),
          model: "gemini-3.5-flash",
          enableSearch: false,
          voice: "Zephyr",
          persona: "general",
          temperature: 1.0,
          thinkingLevel: "auto",
        };
        saveSessions([fresh]);
        setActiveSessionId(fresh.id);
      }
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map((s) => {
      if (s.id === id) {
        return { ...s, title: newTitle };
      }
      return s;
    });
    saveSessions(updated);
  };

  const handleClearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh: ChatSession = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      model: "gemini-3.5-flash",
      enableSearch: false,
      voice: "Zephyr",
      persona: "general",
      temperature: 1.0,
      thinkingLevel: "auto",
    };
    saveSessions([fresh]);
    setActiveSessionId(fresh.id);
  };

  // Update config parameters of active session
  const updateActiveConfig = (
    key: "model" | "enableSearch" | "voice" | "persona" | "temperature" | "thinkingLevel",
    value: any
  ) => {
    if (!activeSessionId) return;
    const updated = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, [key]: value };
      }
      return s;
    });
    saveSessions(updated);
  };

  const handleSendMessage = async (
    content: string,
    imagePayload: { mimeType: string; data: string } | null
  ) => {
    if (!activeSessionId) return;

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession) return;

    // 1. Construct user message object
    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
      image: imagePayload,
    };

    const updatedMessages = [...currentSession.messages, userMsg];

    // 2. Optimistically add user message to state
    let updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, messages: updatedMessages };
      }
      return s;
    });
    saveSessions(updatedSessions);
    setIsGenerating(true);

    try {
      // 3. Request AI response from proxy backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            image: m.image,
          })),
          model: currentSession.model,
          enableSearch: currentSession.enableSearch,
          persona: currentSession.persona || "general",
          temperature: currentSession.temperature !== undefined ? currentSession.temperature : 1.0,
          thinkingLevel: currentSession.thinkingLevel || "auto",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to communicate with Nova AI backend server.");
      }

      const data = await response.json();

      // Parse grounding sources if web search was enabled
      let groundingSources = undefined;
      const chunks = data.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        groundingSources = chunks
          .filter((c: any) => c.web?.uri)
          .map((c: any) => ({
            title: c.web.title || "Search Source",
            url: c.web.uri,
          }));
      }

      // 4. Construct assistant response message
      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: data.text,
        timestamp: Date.now(),
        groundingSources,
      };

      // 5. Smart feature: auto-rename session from "New Chat" to the first few words of the query
      let newTitle = currentSession.title;
      if (currentSession.title === "New Chat") {
        const words = content.split(" ");
        newTitle = words.length > 5 ? words.slice(0, 5).join(" ") + "..." : content;
      }

      updatedSessions = sessions.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            title: newTitle,
            messages: [...updatedMessages, assistantMsg],
          };
        }
        return s;
      });
      
      saveSessions(updatedSessions);
    } catch (error: any) {
      console.error("Chat Error:", error);
      // Append an system-error message to the conversation so the user has clear feedback
      const errMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `⚠️ **Nova AI Error:** ${error.message || "An unexpected network or configuration issue occurred."}\n\n*Please ensure that your Gemini API key is properly set up in your Settings panel (under Secrets).*`,
        timestamp: Date.now(),
      };
      
      updatedSessions = sessions.map((s) => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...updatedMessages, errMsg] };
        }
        return s;
      });
      saveSessions(updatedSessions);
    } finally {
      setIsGenerating(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050508] font-sans antialiased text-slate-200">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={createFreshSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAll={handleClearAll}
        selectedModel={activeSession?.model || "gemini-3.5-flash"}
        onSelectModel={(model) => updateActiveConfig("model", model)}
        enableSearch={activeSession?.enableSearch || false}
        onToggleSearch={(val) => updateActiveConfig("enableSearch", val)}
        selectedVoice={activeSession?.voice || "Zephyr"}
        onSelectVoice={(voice) => updateActiveConfig("voice", voice)}
        selectedPersona={activeSession?.persona || "general"}
        onSelectPersona={(persona) => updateActiveConfig("persona", persona)}
        temperature={activeSession?.temperature !== undefined ? activeSession.temperature : 1.0}
        onChangeTemperature={(temp) => updateActiveConfig("temperature", temp)}
        thinkingLevel={activeSession?.thinkingLevel || "auto"}
        onChangeThinkingLevel={(lvl) => updateActiveConfig("thinkingLevel", lvl)}
      />

      <ChatArea
        session={activeSession}
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        selectedVoice={activeSession?.voice || "Zephyr"}
      />
    </div>
  );
}
