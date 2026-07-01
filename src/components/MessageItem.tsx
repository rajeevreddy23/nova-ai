import { useState, useRef, useEffect } from "react";
import { Message, PRESET_VOICES } from "../types";
import { playRawPCM, formatTime } from "../utils";
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Globe,
  Bot,
  User,
  ExternalLink,
} from "lucide-react";
import Markdown from "react-markdown";

interface MessageItemProps {
  message: Message;
  selectedVoice: string;
}

export default function MessageItem({ message, selectedVoice }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Stop playing on unmount or voice change
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stopAudio = () => {
    try {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      console.error("Error stopping TTS audio:", e);
    }
    setIsPlaying(false);
  };

  const handleTTS = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      setIsSynthesizing(true);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.content.replace(/[\*\#\`\_]/g, ""), // clean markdown symbols
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to synthesize text");
      }

      const data = await response.json();
      setIsSynthesizing(false);
      setIsPlaying(true);

      const { source, ctx } = await playRawPCM(data.audio, 24000);
      audioSourceRef.current = source;
      audioCtxRef.current = ctx;

      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
        audioCtxRef.current = null;
      };
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSynthesizing(false);
      setIsPlaying(false);
      alert("Speech synthesis failed. Please make sure your Gemini API key is configured.");
    }
  };

  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full items-start gap-4 py-6 px-4 md:px-6 transition-colors ${
        isUser ? "bg-transparent" : "bg-transparent"
      }`}
    >
      {/* Avatar column */}
      <div className="shrink-0">
        {isUser ? (
          <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0 border border-white/10 flex items-center justify-center text-sm font-semibold text-slate-300 font-mono select-none">
            {isUser ? "ME" : "JD"}
          </div>
        ) : (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center text-white shadow-lg shadow-indigo-500/10">
            <Bot className="w-5 h-5 text-white" />
            {isPlaying && (
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content column */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 tracking-wide">
            {isUser ? "You" : `Nova AI (${PRESET_VOICES.find((v) => v.name === selectedVoice)?.displayName || selectedVoice})`}
          </span>
          <span className="text-slate-700">/</span>
          <span className="text-[10px] text-slate-500 font-mono">{formatTime(message.timestamp)}</span>
        </div>

        {/* Message attached image */}
        {isUser && message.image && (
          <div className="my-2 max-w-sm rounded-lg overflow-hidden border border-white/10">
            <img
              src={`data:${message.image.mimeType};base64,${message.image.data}`}
              alt="Attached attachment"
              className="w-full max-h-64 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Render text inside a beautiful bubble or simple layout depending on user/assistant */}
        {isUser ? (
          <div className="text-base leading-relaxed text-slate-200 select-text overflow-hidden pt-1">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl rounded-tl-none shadow-2xl space-y-4">
            <div className="text-sm leading-relaxed text-slate-350 select-text overflow-hidden">
              <div className="markdown-body">
                <Markdown>{message.content}</Markdown>
              </div>
            </div>

            {/* Action Toolbar & Citations (for Assistant) */}
            <div className="pt-3 border-t border-white/5 flex flex-col gap-3">
              {/* Citations/Grounding chunks */}
              {message.groundingSources && message.groundingSources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-slate-500 tracking-wider flex items-center gap-1.5 uppercase">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" /> Search Grounding Sources:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.groundingSources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 text-slate-300 rounded-md transition duration-150"
                      >
                        <img
                          src={`https://www.google.com/s2/favicons?sz=32&domain=${new URL(source.url).hostname}`}
                          alt=""
                          className="w-3.5 h-3.5 shrink-0 rounded-sm"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <span className="truncate max-w-[150px] font-medium">{source.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Toolbar Buttons */}
              <div className="flex items-center gap-2">
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-white/5 transition flex items-center gap-1.5 text-xs cursor-pointer"
                  title="Copy response to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Text-To-Speech Button */}
                <button
                  onClick={handleTTS}
                  disabled={isSynthesizing}
                  className={`p-1.5 rounded-md hover:bg-white/5 transition flex items-center gap-1.5 text-xs cursor-pointer ${
                    isPlaying ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                  title={isPlaying ? "Stop listening" : "Listen to this response"}
                >
                  {isSynthesizing ? (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200" />
                    </div>
                  ) : isPlaying ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      {/* Tiny animated waveform bar */}
                      <div className="flex items-end gap-0.5 h-2.5 shrink-0">
                        <span className="w-0.5 bg-indigo-400 rounded-full animate-pulse h-2" />
                        <span className="w-0.5 bg-indigo-400 rounded-full animate-pulse h-3" />
                        <span className="w-0.5 bg-indigo-400 rounded-full animate-pulse h-1.5" />
                      </div>
                      <span className="font-medium text-rose-400">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
