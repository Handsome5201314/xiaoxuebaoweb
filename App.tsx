import React, { useState, useEffect, useRef } from 'react';
import { initializeAIService, sendMessageToSnowball, startLiveCall, endLiveCall, generateUserProfile, DEFAULT_SYSTEM_INSTRUCTION } from './services/geminiService';
import { Sender, Message, UserStats, Achievement, TutorialStep, RandomEvent, AppSettings, CallState, UserProfile } from './types';
import { SnowballAvatar } from './components/SnowballAvatar';
import { StatsBar } from './components/StatsBar';
import { AchievementModal } from './components/AchievementModal';
import { TutorialOverlay } from './components/TutorialOverlay';
import { PersonalCenter } from './components/PersonalCenter';
import { CallOverlay } from './components/CallOverlay';
import { ImageLoader } from './components/ImageLoader';
import { Send, Mic, Image as ImageIcon, Volume2, Info, Trophy, Sparkles, AlertCircle, Settings as SettingsIcon, Phone } from 'lucide-react';

// --- Data Configuration ---

const ACHIEVEMENTS_DATA: Achievement[] = [
  { id: 'first_hello', title: '初次见面', description: '发送你的第一条消息', icon: <Send size={16} /> },
  { id: 'curious_mind', title: '好奇宝宝', description: '询问关于"白血病"的知识', icon: <Sparkles size={16} /> },
  { id: 'visual_learner', title: '视觉探索', description: '触发一次图片请求（如询问器官样子）', icon: <ImageIcon size={16} /> },
  { id: 'brave_hero', title: '小小勇士', description: '完成一次随机突发事件的处理', icon: <Trophy size={16} /> },
  { id: 'nutrition_expert', title: '营养专家', description: '询问关于饮食的建议', icon: <div className="text-lg">🥦</div> },
];

const TUTORIAL_STEPS: TutorialStep[] = [
  { targetId: 'avatar-area', title: '我是小雪宝', content: '我是你的专属健康伙伴。我会根据你的心情改变表情哦！', position: 'bottom' },
  { targetId: 'stats-area', title: '你的成长', content: '这里记录着你的勇气值和健康等级。多和我聊天可以获得星星！', position: 'bottom' },
  { targetId: 'quick-actions', title: '快捷魔法', content: '不知道说什么？点击这些气泡，立刻获得专业的医疗建议或有趣的故事。', position: 'top' },
  { targetId: 'phone-btn', title: '打电话', content: '想直接和我说话吗？点击这个电话按钮，我们可以实时语音聊天哦！（需要 Gemini 模型）', position: 'bottom' },
  { targetId: 'input-area', title: '开始交流', content: '在这里输入文字，或者使用语音和图片功能。让我们开始吧！', position: 'top' },
];

const RANDOM_EVENTS: RandomEvent[] = [
  { 
    id: 'fever', 
    title: '突发状况：体温升高', 
    description: '感觉身体热热的，好像发烧了...', 
    aiPromptTrigger: '[SYSTEM EVENT: 用户突然发烧了 (Simulated Event). 请用安抚的语气询问体温，并给出物理降温的建议，同时鼓励孩子。]' 
  },
  { 
    id: 'sadness', 
    title: '心情雨天', 
    description: '看着窗外，突然觉得有点想家...', 
    aiPromptTrigger: '[SYSTEM EVENT: 用户感到突然的悲伤和想家 (Simulated Event). 请讲一个简短的关于勇气和陪伴的暖心小故事来安慰用户。]' 
  },
  { 
    id: 'appetite', 
    title: '肚子饿了', 
    description: '肚子咕咕叫，但是不知道什么能吃...', 
    aiPromptTrigger: '[SYSTEM EVENT: 用户饿了 (Simulated Event). 请列举3种适合白血病患儿吃的健康零食，并解释为什么它们是安全的。]' 
  }
];

// Default Settings
const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
  voiceTone: 'standard',
  geminiKey: process.env.API_KEY || '',
  geminiModel: 'gemini-2.5-flash',
  geminiLiveModel: 'gemini-2.5-flash-native-audio-preview-09-2025', // Default Live Model
  openaiBaseUrl: 'https://api.deepseek.com/v1',
  openaiKey: '',
  openaiModel: 'deepseek-chat',
  siliconFlowKey: '',
  siliconFlowModel: 'deepseek-ai/DeepSeek-V3',
  difyBaseUrl: 'https://api.dify.ai/v1',
  difyKey: '',
  difyAppType: 'chat',
  xiaoZhiMcpUrl: ''
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>({ stars: 0, level: 1, streak: 1, unlockedAchievements: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('snowball_settings');
    // Merge saved settings with defaults to ensure new fields (like voiceTone, geminiLiveModel) exist
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('snowball_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

  // Modal States
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Call State
  const [callStatus, setCallStatus] = useState<CallState>(CallState.Idle);
  
  // Tutorial States
  const [tutorialIndex, setTutorialIndex] = useState(-1);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Initialize AI & Welcome
  useEffect(() => {
    // Initialize with current settings
    initializeAIService(appSettings);

    const initialMsg = {
      id: 'welcome',
      text: '你好呀！我是小雪宝。这里是你的专属秘密基地。今天感觉怎么样？',
      sender: Sender.Bot,
      timestamp: Date.now(),
    };
    setMessages([initialMsg]);

    const timer = setTimeout(() => {
      if (!hasSeenTutorial) {
        setTutorialIndex(0);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [hasSeenTutorial]); // Only run once on mount/tutorial check

  // Handle Settings Save
  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    localStorage.setItem('snowball_settings', JSON.stringify(newSettings));
    initializeAIService(newSettings); // Re-init AI service
    
    // Show confirmation toast
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      text: '配置已更新，小雪宝准备就绪！',
      sender: Sender.System,
      timestamp: Date.now(),
      isEvent: false
    }]);
  };

  // Handle Profile Generation
  const handleGenerateProfile = async () => {
    setIsGeneratingProfile(true);
    try {
      // Use real chat messages only for analysis
      const chatHistory = messages.filter(m => m.sender === Sender.User || m.sender === Sender.Bot).map(m => ({
          text: m.text,
          sender: m.sender
      }));

      const profile = await generateUserProfile(chatHistory, appSettings);
      if (profile) {
          setUserProfile(profile);
          localStorage.setItem('snowball_user_profile', JSON.stringify(profile));
          setMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            text: '📋 你的个人画像已更新，快去个人中心看看吧！',
            sender: Sender.System,
            timestamp: Date.now(),
            isEvent: false
          }]);
      } else {
         // Silent fail or toast? Let's rely on the personal center showing old data or none
         console.warn("Profile generation returned null");
      }
    } catch (e) {
      console.error("Profile generation error", e);
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Helpers ---

  const unlockAchievement = (id: string) => {
    if (!stats.unlockedAchievements.includes(id)) {
      setStats(prev => ({
        ...prev,
        stars: prev.stars + 5,
        unlockedAchievements: [...prev.unlockedAchievements, id]
      }));
      
      const achievement = ACHIEVEMENTS_DATA.find(a => a.id === id);
      setMessages(prev => [...prev, {
        id: `ach-${Date.now()}`,
        text: `🏆 解锁成就：${achievement?.title}！获得5颗勇气星！`,
        sender: Sender.System,
        timestamp: Date.now(),
        isEvent: true
      }]);
    }
  };

  const triggerRandomEvent = async () => {
    // 30% chance to trigger
    if (Math.random() > 0.7) return;

    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    
    setMessages(prev => [...prev, {
      id: `evt-${Date.now()}`,
      text: `🎲 ${event.title}: ${event.description}`,
      sender: Sender.System,
      timestamp: Date.now(),
      isEvent: true
    }]);

    setIsLoading(true);
    try {
      const responseText = await sendMessageToSnowball(event.aiPromptTrigger);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.Bot,
        timestamp: Date.now(),
      }]);
      
      unlockAchievement('brave_hero');

    } catch (error) {
      console.error("Event trigger failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Interaction Handlers ---

  const handleStartCall = async () => {
    if (appSettings.provider !== 'gemini') {
       setMessages(prev => [...prev, {
         id: `sys-${Date.now()}`,
         text: '⚠️ 通话功能目前仅支持 Google Gemini 模型。请在设置中切换供应商。',
         sender: Sender.System,
         timestamp: Date.now(),
         isEvent: true
       }]);
       return;
    }
    
    try {
      await startLiveCall((status) => setCallStatus(status));
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        text: `❌ 启动通话失败: ${e.message}`,
        sender: Sender.System,
        timestamp: Date.now(),
        isEvent: true
      }]);
      setCallStatus(CallState.Idle);
    }
  };

  const handleEndCall = (duration: number) => {
    endLiveCall();
    setCallStatus(CallState.Idle);
    
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    setMessages(prev => [...prev, {
      id: `call-${Date.now()}`,
      text: `📞 通话结束，时长 ${timeStr}`,
      sender: Sender.System,
      timestamp: Date.now(),
      isEvent: false
    }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: Sender.User,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    unlockAchievement('first_hello');
    if (userText.includes('白血病')) unlockAchievement('curious_mind');
    if (userText.includes('吃') || userText.includes('食物')) unlockAchievement('nutrition_expert');

    setStats(prev => ({ ...prev, stars: prev.stars + 1 }));

    try {
      const responseText = await sendMessageToSnowball(userText);
      
      let finalText = responseText;
      let imageUrl = undefined;

      // 1. Check for Mock Image Request Regex (Legacy/Demo)
      const mockImgRegex = /\[IMAGE_REQUEST:\s*(.*?)\]/;
      const mockMatch = finalText.match(mockImgRegex);
      
      if (mockMatch) {
        const keyword = mockMatch[1];
        imageUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
        finalText = finalText.replace(mockImgRegex, '').trim();
        finalText += `\n(小雪宝为你找到了一张关于 "${keyword}" 的示意图)`;
        unlockAchievement('visual_learner');
      } 
      
      // 2. Check for Markdown Images (Standard Dify/Gemini output)
      // Finds: ![alt](url)
      const markdownImgRegex = /!\[(.*?)\]\((.*?)\)/;
      const markdownMatch = finalText.match(markdownImgRegex);

      if (!imageUrl && markdownMatch) {
        imageUrl = markdownMatch[2];
        // Optional: Remove the image markup from text to avoid duplication if you only want the card
        finalText = finalText.replace(markdownImgRegex, '').trim(); 
        unlockAchievement('visual_learner');
      }

      // 3. Check for Raw URLs that look like images (if Dify sends just a URL)
      // This is a fallback for when Dify doesn't use markdown syntax
      if (!imageUrl) {
        const urlRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/i;
        const urlMatch = finalText.match(urlRegex);
        if (urlMatch) {
            imageUrl = urlMatch[1];
            // Don't remove URL from text as it might be part of a sentence, unless it's the ONLY thing
            if (finalText.trim() === imageUrl) {
                finalText = "这是你要的图片：";
            }
            unlockAchievement('visual_learner');
        }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: finalText,
        sender: Sender.Bot,
        timestamp: Date.now(),
        imageUrl: imageUrl,
        hasImage: !!imageUrl
      };

      setMessages(prev => [...prev, botMsg]);

      setTimeout(() => {
          triggerRandomEvent();
      }, 3000);

    } catch (error: any) {
        console.error("Msg Error", error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `连接似乎断开了: ${error.message}`,
          sender: Sender.Bot,
          timestamp: Date.now(),
        }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    
    // Apply Tone Settings for Browser TTS
    switch (appSettings.voiceTone) {
      case 'cute':
        utterance.pitch = 1.6; // Higher pitch like Pikachu
        utterance.rate = 1.1;
        break;
      case 'deep':
        utterance.pitch = 0.7;
        utterance.rate = 0.9;
        break;
      case 'gentle':
        utterance.pitch = 1.0;
        utterance.rate = 0.8; // Slower, soothing
        break;
      default: // standard
        utterance.pitch = 1.1; // Slightly higher than default for a child-like feel
        utterance.rate = 1.0;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Responsive Container Classes
  // Mobile: Full screen (h-[100dvh]), full width
  // Tablet/Desktop (md): Floating card (max-w-[540px]), centered vertically/horizontally, rounded, border
  const containerClasses = "flex flex-col h-[100dvh] w-full md:max-w-[540px] md:h-[92vh] md:my-[4vh] md:mx-auto md:rounded-[40px] md:border-[10px] md:border-white md:shadow-2xl bg-white overflow-hidden relative transition-all duration-300 ease-in-out";

  return (
    <div className={containerClasses}>
      
      {/* Overlays - Absolute positioning ensures they stay inside the "Phone" container */}
      {callStatus !== CallState.Idle && (
        <CallOverlay status={callStatus} onEndCall={handleEndCall} />
      )}

      {tutorialIndex >= 0 && tutorialIndex < TUTORIAL_STEPS.length && (
        <TutorialOverlay 
          step={TUTORIAL_STEPS[tutorialIndex]}
          currentStepIndex={tutorialIndex}
          totalSteps={TUTORIAL_STEPS.length}
          onNext={() => {
            if (tutorialIndex === TUTORIAL_STEPS.length - 1) {
               setTutorialIndex(-1);
               setHasSeenTutorial(true);
            } else {
               setTutorialIndex(prev => prev + 1);
            }
          }}
          onSkip={() => {
            setTutorialIndex(-1);
            setHasSeenTutorial(true);
          }}
        />
      )}

      <AchievementModal 
        isOpen={showAchievements} 
        onClose={() => setShowAchievements(false)} 
        achievements={ACHIEVEMENTS_DATA}
        unlockedIds={stats.unlockedAchievements}
      />

      <PersonalCenter 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={appSettings}
        onSave={handleSaveSettings}
        userProfile={userProfile}
        messageHistory={messages}
        onGenerateProfile={handleGenerateProfile}
        isGeneratingProfile={isGeneratingProfile}
      />
      
      {/* Header Area */}
      <div id="avatar-area" className="bg-gradient-to-b from-[#FFEAD5] to-blue-50 pt-6 pb-2 rounded-b-[3rem] shadow-sm z-10 relative shrink-0">
        <div className="absolute top-2 right-4 flex space-x-2">
             <button 
               id="phone-btn"
               onClick={handleStartCall}
               className="bg-green-400 text-white p-1.5 md:p-2 rounded-full hover:bg-green-500 transition-colors shadow-sm animate-bounce-slow"
             >
                <Phone size={18} className="md:w-5 md:h-5" fill="currentColor" />
             </button>
             <button 
               onClick={() => setShowAchievements(true)} 
               className="bg-yellow-400 text-white p-1.5 md:p-2 rounded-full hover:bg-yellow-500 transition-colors shadow-sm"
             >
                <Trophy size={18} className="md:w-5 md:h-5" />
             </button>
             <button onClick={() => setShowSettings(true)} className="bg-blue-400 text-white p-1.5 md:p-2 rounded-full hover:bg-blue-500 transition-colors shadow-sm">
                <SettingsIcon size={18} className="md:w-5 md:h-5" />
             </button>
             <button onClick={() => setTutorialIndex(0)} className="text-gray-400 hover:text-blue-500 p-1">
                <Info size={20} className="md:w-6 md:h-6" />
             </button>
        </div>
        <SnowballAvatar isTalking={isLoading} emotion={isLoading ? 'concerned' : 'happy'} />
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-700 font-['ZCOOL_KuaiLe'] tracking-wide">小雪宝 (LeukemiaPal)</h1>
          <p className="text-xs md:text-sm text-gray-500 font-['Nunito']">你身边最贴心的医疗小助手</p>
        </div>
        <div className="mt-4" id="stats-area">
           <StatsBar stats={stats} />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-blue-50/50 scrollbar-hide">
        
        {messages.map((msg) => {
          if (msg.sender === Sender.System) {
             return (
               <div key={msg.id} className="flex justify-center animate-fade-in">
                 <div className={`text-xs md:text-sm px-4 py-2 rounded-full flex items-center space-x-2 shadow-sm border ${msg.isEvent ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                    {msg.isEvent ? <AlertCircle size={14} /> : <Trophy size={14} />}
                    <span>{msg.text}</span>
                 </div>
               </div>
             );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl relative shadow-sm text-sm md:text-base leading-relaxed transition-all duration-300 ${
                  msg.sender === Sender.User
                    ? 'bg-blue-50 text-white rounded-br-none'
                    : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                }`}
              >
                {msg.text.split('\n').map((line, i) => (
                   <p key={i} className="mb-1 last:mb-0">{line}</p>
                ))}
                
                {msg.imageUrl && (
                  <div className="mt-3">
                     <ImageLoader src={msg.imageUrl} alt="Generated Content" />
                  </div>
                )}

                {msg.sender === Sender.Bot && (
                   <div className="mt-2 flex justify-end space-x-2">
                      <button 
                        onClick={() => playAudio(msg.text)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                         <Volume2 size={16} />
                      </button>
                   </div>
                )}
              </div>
            </div>
          );
        })}
        
        {isLoading && (
           <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm">
                 <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div id="input-area" className="p-4 bg-white border-t border-blue-50 relative z-20 shrink-0">
        {/* Quick Actions */}
        <div id="quick-actions" className="flex space-x-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => {setInput('什么是白血病？'); handleSend();}} className="whitespace-nowrap px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs md:text-sm border border-orange-100 hover:bg-orange-100 transition-colors">
               🦠 什么是白血病？
            </button>
            <button onClick={() => {setInput('我今天要吃什么？'); handleSend();}} className="whitespace-nowrap px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs md:text-sm border border-green-100 hover:bg-green-100 transition-colors">
               🥦 营养建议
            </button>
            <button onClick={() => {setInput('给我讲个故事吧'); handleSend();}} className="whitespace-nowrap px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs md:text-sm border border-purple-100 hover:bg-purple-100 transition-colors">
               📖 讲个故事
            </button>
        </div>

        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-full border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <button className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-white transition-colors">
             <Mic size={20} className="md:w-6 md:h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="和小雪宝说点什么..."
            className="flex-1 bg-transparent border-none outline-none text-sm md:text-base text-gray-700 placeholder-gray-400"
            disabled={isLoading}
          />
          <button className="p-2 text-gray-400 hover:text-purple-500 rounded-full hover:bg-white transition-colors">
             <ImageIcon size={20} className="md:w-6 md:h-6" />
          </button>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-full transition-all duration-200 ${
               input.trim() && !isLoading 
               ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600 transform hover:scale-105' 
               : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} className="md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}