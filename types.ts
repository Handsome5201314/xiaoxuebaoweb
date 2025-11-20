export enum Sender {
  User = 'user',
  Bot = 'bot',
  System = 'system' // Added for game events
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isThinking?: boolean;
  hasImage?: boolean;
  imageUrl?: string;
  hasAudio?: boolean;
  isEvent?: boolean; // Visual distinction for events
}

export interface UserStats {
  level: number;
  stars: number;
  streak: number;
  unlockedAchievements: string[];
}

export enum GameMode {
  Chat = 'chat',
  Story = 'story',
  Draw = 'draw'
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  aiPromptTrigger: string; // Invisible prompt sent to AI to react to the event
}

export interface TutorialStep {
  targetId: string; // ID of the DOM element to highlight
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export enum CallState {
  Idle = 'idle',
  Connecting = 'connecting',
  Active = 'active',
  Ended = 'ended',
  Error = 'error'
}

// --- New Types for Personal Center ---

export type ModelProvider = 'gemini' | 'openai' | 'dify' | 'siliconflow';

// New Voice Tone Type
export type VoiceTone = 'standard' | 'cute' | 'gentle' | 'deep';

export interface UserProfile {
  summary: string;
  tags: string[];
  advice: string;
}

export interface AppSettings {
  provider: ModelProvider;
  systemInstruction?: string; // Custom system prompt/role definition
  voiceTone: VoiceTone; // New setting for voice personality
  
  // Google Gemini
  geminiKey: string;
  geminiModel: string; // Text model
  geminiLiveModel: string; // Audio/Live model
  
  // OpenAI Compatible (DeepSeek, SiliconFlow, etc.)
  openaiBaseUrl: string;
  openaiKey: string;
  openaiModel: string;

  // SiliconFlow Specific
  siliconFlowKey: string;
  siliconFlowModel: string;
  
  // Dify
  difyBaseUrl: string;
  difyKey: string;
  difyAppType: 'chat' | 'workflow'; // 'chat' for Chatflow/Agent, 'workflow' for raw Workflow
  difyConversationId?: string; // To maintain conversation history in Dify
}