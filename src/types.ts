export interface GroundingSource {
  title: string;
  url: string;
}

export interface ImageAttachment {
  mimeType: string;
  data: string; // base64 representation
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  image?: ImageAttachment | null;
  groundingSources?: GroundingSource[];
  isGeneratingSpeech?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  model: string;
  enableSearch: boolean;
  voice: string;
  persona?: string;
  temperature?: number;
  thinkingLevel?: string;
}

export interface VoiceOption {
  name: string;
  displayName: string;
  gender: "Male" | "Female" | "Neutral";
  description: string;
}

export const PRESET_VOICES: VoiceOption[] = [
  { name: "Zephyr", displayName: "Zephyr", gender: "Male", description: "Smooth, warm, and professional" },
  { name: "Kore", displayName: "Kore", gender: "Female", description: "Bright, energetic, and clear" },
  { name: "Puck", displayName: "Puck", gender: "Male", description: "Creative, engaging, and friendly" },
  { name: "Charon", displayName: "Charon", gender: "Male", description: "Deep, authoritative, and calm" },
  { name: "Fenrir", displayName: "Fenrir", gender: "Female", description: "Serene, premium, and poised" },
];

export const PRESET_STARTERS = [
  {
    title: "TypeScript expert",
    prompt: "Write a resilient, clean TypeScript function to retry asynchronous operations with exponential backoff.",
    category: "Coding",
  },
  {
    title: "Explain Quantum Physics",
    prompt: "Explain Quantum Entanglement in simple terms using a metaphor of two magic dice.",
    category: "Exploration",
  },
  {
    title: "Draft professional email",
    prompt: "Help me write a highly polite, assertive email requesting a deadline extension for a major project milestone.",
    category: "Writing",
  },
  {
    title: "Creative brainstorming",
    prompt: "Generate 5 creative, catchy names and a central slogan for an eco-friendly specialty coffee brand.",
    category: "Creative",
  },
];
