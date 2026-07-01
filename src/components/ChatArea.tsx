import React, { useState, useRef, useEffect } from "react";
import { Message, ChatSession, PRESET_STARTERS } from "../types";
import { fileToBase64 } from "../utils";
import MessageItem from "./MessageItem";
import {
  Send,
  Image,
  Sparkles,
  ArrowDown,
  X,
  Compass,
  Zap,
  Globe,
  CornerDownLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatAreaProps {
  session: ChatSession | null;
  onSendMessage: (content: string, image: { mimeType: string; data: string } | null) => void;
  isGenerating: boolean;
  selectedVoice: string;
}

export default function ChatArea({
  session,
  onSendMessage,
  isGenerating,
  selectedVoice,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom();
  }, [session?.messages?.length, isGenerating]);

  // Monitor scroll height to show/hide "Scroll to bottom" button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const diff = target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollBtn(diff > 300);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG, JPG, etc.)");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && !imageFile) return;
    if (isGenerating) return;

    let attachedImage = null;
    if (imageFile) {
      try {
        attachedImage = await fileToBase64(imageFile);
      } catch (err) {
        console.error("Failed to parse image file", err);
        alert("Could not process the uploaded image.");
        return;
      }
    }

    const text = input.trim();
    setInput("");
    removeImage();

    // Call callback to send message
    onSendMessage(text, attachedImage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!session) {
    return (
      <div className="flex-1 bg-[#050508] flex items-center justify-center text-slate-400 p-6 relative overflow-hidden">
        {/* Background visual glowing spheres */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none select-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none select-none" />
        
        <div className="text-center space-y-4 max-w-sm z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/20 animate-bounce">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-200">No Chat Selected</h2>
          <p className="text-sm text-slate-500">
            Select an existing conversation from the sidebar or launch a brand new chat to communicate with Nova AI.
          </p>
        </div>
      </div>
    );
  }

  const hasMessages = session.messages.length > 0;

  return (
    <div className="flex-1 bg-[#050508] flex flex-col h-full overflow-hidden relative">
      {/* Background visual glowing spheres */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none select-none" />

      {/* Top Header of Chat Area */}
      <header className="h-16 border-b border-white/5 backdrop-blur-sm bg-black/10 px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              {session.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono capitalize">
                Model: {session.model === "gemini-3.1-pro-preview" ? "Nova Pro 3.1" : "Nova Flash 3.5"}
              </span>
              {session.enableSearch && (
                <>
                  <span className="text-[10px] text-slate-600">•</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                    <Globe className="w-2.5 h-2.5" /> Web Grounded
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages Scroll Panel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative z-10"
      >
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            /* Elegant greeting screen when conversation is completely empty */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center space-y-10"
            >
              {/* Spinning / breathing beautiful sphere */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-35 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                  <Sparkles className="w-9 h-9 text-white animate-pulse" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="font-display font-extrabold text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 leading-tight">
                  I am Nova AI
                </h1>
                <p className="text-slate-450 text-sm max-w-md mx-auto leading-relaxed">
                  Your premium intelligent assistant. I am optimized for creative writing, meticulous coding, analysis, and deep reasoning. How may I assist you today?
                </p>
              </div>

              {/* Starter Presets */}
              <div className="w-full space-y-4">
                <p className="text-xs font-semibold text-slate-500 tracking-wider flex items-center justify-center gap-2 uppercase">
                  <Compass className="w-4 h-4 text-indigo-400" /> Choose a Starter Challenge
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  {PRESET_STARTERS.map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(starter.prompt);
                      }}
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 backdrop-blur-md transition duration-200 group text-left cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                          {starter.category}
                        </span>
                        <span className="text-[10px] text-slate-600 group-hover:text-slate-450 transition">
                          Apply prompt →
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-slate-50 transition mb-1">
                        {starter.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {starter.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="w-full space-y-4 py-4 px-2 md:px-4">
              {session.messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  selectedVoice={session.voice}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Loading generation block */}
        {isGenerating && (
          <div className="flex w-full items-start gap-4 py-6 px-4 md:px-6 bg-white/5 border-y border-white/5">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/10">
              <Sparkles className="w-5 h-5 animate-spin text-white" />
            </div>
            <div className="flex-1 space-y-2 mt-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wide">
                Nova AI is crafting...
              </span>
              <div className="space-y-2">
                <div className="h-3 bg-white/5 border border-white/5 rounded w-5/6 animate-pulse" />
                <div className="h-3 bg-white/5 border border-white/5 rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-white/5 border border-white/5 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Float Scroll-To-Bottom Trigger */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 right-8 z-20 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-slate-100 shadow-xl cursor-pointer transition"
        >
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </button>
      )}

      {/* Bottom Console Panel */}
      <div className="p-4 md:p-8 border-t border-white/5 bg-black/10 backdrop-blur-sm relative z-10 shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative group">
          {/* Glow backdrop */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition pointer-events-none"></div>
          
          {/* Main textarea input block */}
          <div className="relative rounded-2xl border border-white/10 bg-[#121218] p-2 flex flex-col gap-2 shadow-inner shadow-white/5 transition duration-200">
            
            {/* Image Preview attachment row */}
            {imagePreview && (
              <div className="p-3 border-b border-white/5 flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10">
                  <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/80 text-rose-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs">
                  <p className="text-slate-300 font-medium truncate max-w-[200px]">{imageFile?.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {(imageFile!.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}

            {/* Console textbox area */}
            <div className="flex items-start gap-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  imageFile
                    ? "Ask Nova something about this image..."
                    : "Message Nova AI..."
                }
                rows={2}
                disabled={isGenerating}
                className="flex-1 bg-transparent border-0 text-slate-200 text-sm focus:ring-0 focus:outline-none resize-none p-2 font-sans placeholder-slate-500"
              />
            </div>

            {/* Bottom tool buttons inside input frame */}
            <div className="flex items-center justify-between border-t border-white/5 px-3 py-2 bg-black/20 rounded-b-xl">
              <div className="flex items-center gap-1">
                {/* Image Attach Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isGenerating}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 cursor-pointer transition flex items-center justify-center"
                  title="Attach an image for analysis"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-650 hidden sm:flex items-center gap-1 font-mono">
                  <span>Enter to send</span>
                  <CornerDownLeft className="w-2.5 h-2.5" />
                </span>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isGenerating || (!input.trim() && !imageFile)}
                  className={`py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm transition cursor-pointer ${
                    isGenerating || (!input.trim() && !imageFile)
                      ? "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:brightness-110 shadow-lg shadow-indigo-500/20"
                  }`}
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </form>
        <p className="text-[10px] text-slate-600 text-center mt-3 select-none">
          Nova AI can analyze visual media and access web sources. Correctness is prioritized; make sure to verify external references.
        </p>
      </div>
    </div>
  );
}
