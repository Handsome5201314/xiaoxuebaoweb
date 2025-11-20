import { GoogleGenAI, Chat, GenerateContentResponse, LiveServerMessage, Modality, Blob } from "@google/genai";
import { AppSettings, CallState, UserProfile } from "../types";

// Default System Instruction (used for Gemini/OpenAI if not provided by Dify)
export const DEFAULT_SYSTEM_INSTRUCTION = `
# 角色
你是“小雪宝”(Little Snowball)，是一个基于先进AI技术的智能医疗助手，专为白血病患儿及其家庭提供全方位服务。你具备耐心关怀、好奇探寻、鼓励肯定、沉静坚韧、热情支持的性格特点。

## 核心原则
1. **形象**: 虚拟卡通形象，柔和线条，大眼睛，给人安全感。
2. **语气**: 温和、中性的童声，发音清晰。根据用户年龄调整。
3. **安全**: 始终包含医疗免责声明。不提供具体诊断，只提供科普支持。

## 技能
1. **白血病诊断解释**: 用比喻解释。
2. **治疗方案理解**: 分步骤解释。
3. **副作用管理**: 提供饮食、护理建议。
4. **图片请求**: 当用户提到具体器官或需要看图时，标记 [IMAGE_REQUEST: 关键词]。
`;

// Global State for Service
let currentSettings: AppSettings | null = null;
let geminiInstance: GoogleGenAI | null = null;
let geminiChatSession: Chat | null = null;

// Live API State
let liveSession: any = null; // Session object
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let audioProcessor: ScriptProcessorNode | null = null;
let audioSource: MediaStreamAudioSourceNode | null = null;
let nextPlayTime = 0;
let callStatusCallback: ((state: CallState) => void) | null = null;

// Track active audio sources to allow interruption
const activeAudioSources = new Set<AudioBufferSourceNode>();

// --- Helper Functions for Live API ---

function encodePCM(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodePCM(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encodePCM(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Helper to safely parse error response ---
const parseErrorResponse = async (response: Response) => {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return { json, text };
    } catch {
      return { json: {}, text };
    }
  } catch (e) {
    return { json: {}, text: response.statusText || "Unknown Network Error" };
  }
};

// Helper to safely stringify objects avoiding [object Object]
const safeStringify = (val: any): string => {
  if (typeof val === 'string') return val;
  try {
    if (val === '[object Object]') return '';
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
};

// Robust error message extractor
const getErrorMessage = (json: any, text: string): string => {
  try {
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      // 1. Check for explicit 'message' string
      if (typeof json.message === 'string') return json.message;
      // 2. Check for 'message' object (stringify it)
      if (json.message && typeof json.message === 'object') return safeStringify(json.message);
      
      // 3. Check for 'msg'
      if (typeof json.msg === 'string') return json.msg;
      
      // 4. Check for 'error' string or object
      if (json.error) {
          if (typeof json.error === 'string') return json.error;
          if (typeof json.error.message === 'string') return json.error.message;
          return safeStringify(json.error);
      }
      
      // 5. Check for 'code' + 'message' pattern (Dify common)
      if (json.code && json.message) {
          return `${json.code}: ${typeof json.message === 'string' ? json.message : safeStringify(json.message)}`;
      }

      // 6. Fallback: if json has content, stringify the whole thing
      if (Object.keys(json).length > 0) {
          return safeStringify(json);
      }
    }
  } catch (e) {
    console.error("Error parsing error message object", e);
  }
  
  // Fallback to text body
  if (typeof text === 'string' && text.trim().length > 0) {
      // Prevent returning "[object Object]" literally
      if (text === '[object Object]') return 'Unknown Error (Invalid Response Format)';
      return text;
  }
  
  return 'Unknown Error';
};

// Initialize the service with settings
export const initializeAIService = (settings: AppSettings) => {
  currentSettings = settings;
  console.log("Initializing AI Service with provider:", settings.provider);

  if (settings.provider === 'gemini' && settings.geminiKey) {
    try {
      geminiInstance = new GoogleGenAI({ apiKey: settings.geminiKey });
      geminiChatSession = geminiInstance.chats.create({
        model: settings.geminiModel || 'gemini-2.5-flash',
        config: {
          systemInstruction: settings.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });
    } catch (e) {
      console.error("Failed to init Gemini", e);
    }
  }
};

// --- Live Call Functions ---

export const startLiveCall = async (onStatusChange: (state: CallState) => void) => {
  callStatusCallback = onStatusChange;
  
  if (!currentSettings || currentSettings.provider !== 'gemini') {
    onStatusChange(CallState.Error);
    throw new Error("通话功能目前仅支持 Gemini 模型");
  }

  onStatusChange(CallState.Connecting);

  try {
    if (!geminiInstance) {
      geminiInstance = new GoogleGenAI({ apiKey: currentSettings.geminiKey });
    }

    // 1. Setup Audio Contexts
    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Resume audio contexts to prevent browser auto-play blocks
    await inputAudioContext.resume();
    await outputAudioContext.resume();
    
    nextPlayTime = 0;
    activeAudioSources.clear();

    // 2. Get Microphone Stream
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 3. Determine Voice Name based on Tone
    let voiceName = 'Kore'; // Default Balanced
    const tone = currentSettings.voiceTone || 'standard';
    
    // Gemini Live Voices: 
    // Puck (Energetic/High), Charon (Deep/Confident), Kore (Balanced), Fenrir (Deep/Strong), Zephyr (Calm)
    if (tone === 'cute') voiceName = 'Puck'; 
    else if (tone === 'deep') voiceName = 'Fenrir';
    else if (tone === 'gentle') voiceName = 'Zephyr';

    const liveModel = currentSettings.geminiLiveModel || 'gemini-2.5-flash-native-audio-preview-09-2025';
    console.log(`Starting Live Call with voice: ${voiceName} (${tone}) using model: ${liveModel}`);

    // 4. Connect to Gemini Live API
    const connectPromise = geminiInstance.live.connect({
      model: liveModel, 
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
        },
        systemInstruction: currentSettings.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
      },
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Session Opened");
          onStatusChange(CallState.Active);
          
          // Start Streaming Input Audio
          if (!inputAudioContext || !mediaStream) return;
          
          audioSource = inputAudioContext.createMediaStreamSource(mediaStream);
          audioProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          audioProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            connectPromise.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          
          audioSource.connect(audioProcessor);
          audioProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
           // Handle Interruption FIRST
           if (msg.serverContent?.interrupted) {
              console.log("Model interrupted, stopping audio queue...");
              // Stop all currently playing or scheduled audio
              activeAudioSources.forEach(source => {
                try {
                  source.stop();
                } catch (e) {
                  // Ignore errors if source already stopped
                }
              });
              activeAudioSources.clear();
              nextPlayTime = 0; // Reset play cursor
              return;
           }

           // Handle Audio Output
           const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
           if (base64Audio && outputAudioContext) {
             const audioBuffer = await decodeAudioData(
               decodePCM(base64Audio),
               outputAudioContext,
               24000,
               1
             );
             
             // Calculate start time
             nextPlayTime = Math.max(nextPlayTime, outputAudioContext.currentTime);
             
             const source = outputAudioContext.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(outputAudioContext.destination);
             source.start(nextPlayTime);
             
             // Track the source so we can stop it if interrupted
             activeAudioSources.add(source);
             source.onended = () => {
               activeAudioSources.delete(source);
             };

             nextPlayTime += audioBuffer.duration;
           }
        },
        onclose: () => {
          console.log("Gemini Live Session Closed");
          onStatusChange(CallState.Ended);
        },
        onerror: (err: any) => {
          console.error("Gemini Live Error", err);
          // Try to check if it is a 503 or unavailable error and notify user
          const errorMsg = err.message || JSON.stringify(err);
          if (errorMsg.includes("503") || errorMsg.includes("unavailable")) {
             console.warn("The selected Live model might be overloaded or unavailable.");
          }
          onStatusChange(CallState.Error);
        }
      }
    });

    liveSession = await connectPromise;

  } catch (error) {
    console.error("Failed to start live call", error);
    onStatusChange(CallState.Error);
    endLiveCall();
    throw error; // Re-throw so UI can show specific error message if possible
  }
};

export const endLiveCall = () => {
  try {
    if (callStatusCallback) callStatusCallback(CallState.Ended);
    
    // Stop all active audio sources immediately
    activeAudioSources.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeAudioSources.clear();

    // Close Session
    if (liveSession) {
      // liveSession.close(); 
      liveSession = null;
    }

    // Stop Audio Processing
    if (audioProcessor) {
      audioProcessor.disconnect();
      audioProcessor = null;
    }
    if (audioSource) {
      audioSource.disconnect();
      audioSource = null;
    }

    // Stop Media Stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    // Close Contexts
    if (inputAudioContext) {
      inputAudioContext.close();
      inputAudioContext = null;
    }
    if (outputAudioContext) {
      outputAudioContext.close();
      outputAudioContext = null;
    }

  } catch (e) {
    console.error("Error cleaning up call", e);
  }
};

// --- Helper to Recursively Extract Images from Dify Outputs ---
const extractImagesFromOutputs = (obj: any, foundImages: {url: string, name?: string}[]) => {
  if (!obj) return;

  // Case 1: Direct Dify File Object
  if (typeof obj === 'object' && obj.type === 'image' && obj.url) {
    foundImages.push({ url: obj.url, name: obj.name || 'image' });
    return;
  }
  
  // Case 2: Array of files (common in tools like Janus)
  if (Array.isArray(obj)) {
    obj.forEach(item => extractImagesFromOutputs(item, foundImages));
    return;
  }

  // Case 3: Nested Objects
  if (typeof obj === 'object') {
    Object.values(obj).forEach(val => extractImagesFromOutputs(val, foundImages));
  }
};

// --- Existing Chat Functions ---

// Generate User Profile (Persona) from History
export const generateUserProfile = async (history: {text: string, sender: string}[], providerSettings: AppSettings): Promise<UserProfile | null> => {
  try {
    if (history.length < 3) return null; // Not enough data

    // Construct prompt
    const recentChats = history.slice(-20).map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    const prompt = `
      基于以下对话历史，生成一个简单的用户画像 JSON。
      包含: 
      - summary (一句话总结用户当前状态/情绪，30字以内)
      - tags (3-5个关键词标签，如"焦虑", "喜爱画画", "发烧中")
      - advice (一条给家属或患儿的简短建议，50字以内)
      
      对话历史:
      ${recentChats}

      请严格仅返回 JSON 格式，不要包含 markdown 格式化 (如 \`\`\`json )。
      格式: { "summary": "...", "tags": ["..."], "advice": "..." }
    `;

    let resultText = "";

    // If Gemini
    if (providerSettings.provider === 'gemini' && providerSettings.geminiKey) {
       const genAI = new GoogleGenAI({ apiKey: providerSettings.geminiKey });
       const response = await genAI.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: prompt,
         config: {
           responseMimeType: 'application/json'
         }
       });
       resultText = response.text || "";
    }
    // If SiliconFlow
    else if (providerSettings.provider === 'siliconflow' && providerSettings.siliconFlowKey) {
       const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerSettings.siliconFlowKey}` },
        body: JSON.stringify({
          model: providerSettings.siliconFlowModel || 'deepseek-ai/DeepSeek-V3',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      resultText = data.choices[0].message.content;
    }
    // If OpenAI
    else if (providerSettings.provider === 'openai' && providerSettings.openaiKey) {
       const response = await fetch(`${providerSettings.openaiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${providerSettings.openaiKey}` },
        body: JSON.stringify({
          model: providerSettings.openaiModel || 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      resultText = data.choices[0].message.content;
    } else {
        // Dify / Other not supported for this specific feature yet without a specific workflow
        return null;
    }

    // Clean up markdown if present (Gemini sometimes adds it even with mimeType set)
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        return JSON.parse(resultText);
    } catch (e) {
        console.warn("Failed to parse profile JSON, raw text:", resultText);
        return null;
    }

  } catch (e) {
    console.error("Failed to generate profile", e);
    return null;
  }
};

// Test connection with provided settings (stateless)
export const testConnection = async (settings: AppSettings): Promise<{ success: boolean; message: string }> => {
  try {
    if (settings.provider === 'gemini') {
      if (!settings.geminiKey) return { success: false, message: '缺少 API Key' };
      const genAI = new GoogleGenAI({ apiKey: settings.geminiKey });
      await genAI.models.generateContent({
          model: settings.geminiModel || 'gemini-2.5-flash',
          contents: 'Hello',
      });
      return { success: true, message: 'Gemini 连接成功！' };
    }

    if (settings.provider === 'siliconflow') {
      if (!settings.siliconFlowKey) return { success: false, message: '缺少配置信息' };
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.siliconFlowKey}`
        },
        body: JSON.stringify({
          model: settings.siliconFlowModel || 'deepseek-ai/DeepSeek-V3',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5
        })
      });

      if (!response.ok) {
          const { json, text } = await parseErrorResponse(response);
          const msg = getErrorMessage(json, text);
          throw new Error(`${response.status} ${msg}`);
      }
      return { success: true, message: '硅基流动 (SiliconFlow) 连接成功！' };
    }

    if (settings.provider === 'openai') {
      if (!settings.openaiBaseUrl || !settings.openaiKey) return { success: false, message: '缺少配置信息' };
      const response = await fetch(`${settings.openaiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiKey}`
        },
        body: JSON.stringify({
          model: settings.openaiModel || 'deepseek-chat',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5
        })
      });
      
      if (!response.ok) {
          const { json, text } = await parseErrorResponse(response);
          const msg = getErrorMessage(json, text);
          throw new Error(`${response.status} ${msg}`);
      }
      return { success: true, message: 'OpenAI 接口连接成功！' };
    }

    if (settings.provider === 'dify') {
      if (!settings.difyBaseUrl || !settings.difyKey) return { success: false, message: '缺少配置信息' };
      
      const isWorkflow = settings.difyAppType === 'workflow';
      const baseUrl = settings.difyBaseUrl.replace(/\/$/, '');
      const endpoint = isWorkflow ? `${baseUrl}/workflows/run` : `${baseUrl}/chat-messages`;
      
      const body = isWorkflow 
        ? {
            inputs: { query: "ping", text: "ping" }, // Assuming 'query' is a valid input
            response_mode: "blocking",
            user: "test-user"
          }
        : {
            inputs: {},
            query: 'ping',
            response_mode: "blocking",
            user: "test-connection-user"
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.difyKey}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
          const { json: errorBody, text: errorText } = await parseErrorResponse(response);

          // Handle specific 401/404 for Dify to give hints
          if (response.status === 401) {
            return { success: false, message: `鉴权失败(401)。请检查密钥与应用类型(${isWorkflow ? 'Workflow' : 'Chat'})是否匹配。` };
          }

          // Handle specific Dify error codes
          if (errorBody.code === 'not_workflow_app') {
            return { success: false, message: `模式不匹配(400): 您的应用不是 Workflow 类型。请切换为 [聊天助手 (Chat)] 模式。` };
          }

          if (response.status === 404) {
            return { success: false, message: `接口未找到(404)。请检查 Base URL 或应用类型是否正确。` };
          }
          
          const msg = getErrorMessage(errorBody, errorText);
          throw new Error(`${response.status} ${msg}`);
      }
      return { success: true, message: `Dify ${isWorkflow ? 'Workflow' : 'Chat'} 连接成功！` };
    }

    return { success: false, message: '未知供应商' };
  } catch (e: any) {
    console.error("Test Connection Error", e);
    const safeMsg = typeof e.message === 'string' ? e.message : safeStringify(e.message || e);
    return { success: false, message: `连接失败: ${safeMsg}` };
  }
};

// Unified Send Message Function
export const sendMessageToSnowball = async (message: string): Promise<string> => {
  if (!currentSettings) {
    throw new Error("AI Service not initialized");
  }

  try {
    // --- 1. Google Gemini Provider ---
    if (currentSettings.provider === 'gemini') {
      if (!geminiChatSession) {
         initializeAIService(currentSettings);
         if(!geminiChatSession) throw new Error("Gemini session creation failed");
      }
      const response: GenerateContentResponse = await geminiChatSession.sendMessage({
        message: message
      });
      return response.text || "小雪宝正在思考...";
    }

    // --- 2. SiliconFlow Provider ---
    if (currentSettings.provider === 'siliconflow') {
      if (!currentSettings.siliconFlowKey) {
        return "请先在个人中心配置硅基流动 (SiliconFlow) API 信息。";
      }

      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSettings.siliconFlowKey}`
        },
        body: JSON.stringify({
          model: currentSettings.siliconFlowModel || 'deepseek-ai/DeepSeek-V3',
          messages: [
            { role: 'system', content: currentSettings.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION },
            { role: 'user', content: message }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const { json, text } = await parseErrorResponse(response);
        const msg = getErrorMessage(json, text);
        throw new Error(`SiliconFlow API Error: ${response.status} ${msg}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "收到空回复";
    }

    // --- 3. OpenAI Compatible Provider (DeepSeek, etc.) ---
    if (currentSettings.provider === 'openai') {
      if (!currentSettings.openaiBaseUrl || !currentSettings.openaiKey) {
        return "请先在个人中心配置 OpenAI/DeepSeek API 信息。";
      }

      const response = await fetch(`${currentSettings.openaiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSettings.openaiKey}`
        },
        body: JSON.stringify({
          model: currentSettings.openaiModel || 'deepseek-chat',
          messages: [
            { role: 'system', content: currentSettings.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION },
            { role: 'user', content: message }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const { json, text } = await parseErrorResponse(response);
        const msg = getErrorMessage(json, text);
        throw new Error(`OpenAI API Error: ${response.status} ${msg}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "收到空回复";
    }

    // --- 4. Dify Provider ---
    if (currentSettings.provider === 'dify') {
      if (!currentSettings.difyBaseUrl || !currentSettings.difyKey) {
        return "请先在个人中心配置 Dify API 信息。";
      }

      const isWorkflow = currentSettings.difyAppType === 'workflow';
      const baseUrl = currentSettings.difyBaseUrl.replace(/\/$/, '');
      const endpoint = isWorkflow ? `${baseUrl}/workflows/run` : `${baseUrl}/chat-messages`;

      const body = isWorkflow 
      ? {
          // Ensure inputs contains common parameter names to match potential Start Node variables
          inputs: { 
            query: message, 
            text: message,
            input: message,
            question: message
          },
          response_mode: "blocking",
          user: "snowball-user-" + (currentSettings.difyConversationId || "default")
        }
      : {
          inputs: {},
          query: message,
          response_mode: "blocking",
          user: "snowball-user-" + (currentSettings.difyConversationId || "default"),
          conversation_id: currentSettings.difyConversationId || undefined
        };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSettings.difyKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const { json: errData, text: errText } = await parseErrorResponse(response);
        console.error("Dify Error:", errData);
        
        if (response.status === 401) {
             return `Dify 认证失败 (401)。请检查您的 API Key 类型是否为 [${isWorkflow ? 'Workflow' : 'Chat App'}]。`;
        }

        if (errData.code === 'not_workflow_app') {
             return `配置错误：您的 Dify 应用不支持 Workflow API。请在个人中心将 Dify 模式切换为 [聊天助手 (Chat)] 模式。`;
        }
        
        // Auto-recovery for "Conversation Not Exists" (Chatflow only)
        if (!isWorkflow && (
            errData.code === 'conversation_not_exists' || 
            (typeof errData.message === 'string' && errData.message.includes('Conversation Not Exists')) ||
             response.status === 404
        )) {
             console.log("Dify conversation stale, resetting...");
             currentSettings.difyConversationId = ""; // Clear stale ID
             // Retry recursively once if we haven't retried yet
             if (!message.includes("[INTERNAL_RETRY]")) {
                 await new Promise(resolve => setTimeout(resolve, 200));
                 return sendMessageToSnowball(message); // Retry
             }
        }

        const msg = getErrorMessage(errData, errText);
        return `Dify 连接失败: ${msg}`;
      }

      const data = await response.json();
      
      let outputText = "";
      let outputFiles: {url: string, name?: string}[] = [];

      if (isWorkflow) {
        // Workflow response format: data.data.outputs
        const outputs = data.data?.outputs || {};
        
        // 1. Try to find main text response
        outputText = outputs.text || outputs.answer || outputs.result || outputs.content || outputs.response;
        
        // If no specific key matches, but there is exactly one string output, use it
        if (!outputText && typeof outputs === 'object') {
            const keys = Object.keys(outputs);
            if (keys.length === 1 && typeof outputs[keys[0]] === 'string') {
                outputText = outputs[keys[0]];
            }
        }

        // 2. Recursively find all files/images in outputs
        extractImagesFromOutputs(outputs, outputFiles);

        // Fallback: JSON stringify if no text found and we have meaningful data
        if (!outputText) {
            if (Object.keys(outputs).length === 0) {
                 outputText = "Workflow 执行成功，但未返回任何 Output 变量。";
            } else if (outputFiles.length === 0) { // Only stringify if we haven't found images to show
                 // Filter out files from stringify to avoid clutter
                 const safeOutputs = { ...outputs };
                 // Simple attempt to reduce huge JSON dump
                 outputText = ""; 
            } else {
                 outputText = ""; // We have images, so empty text is fine (images will be appended)
            }
        }
      } else {
        // Chatflow response format: data.answer
        if (data.conversation_id) {
            currentSettings.difyConversationId = data.conversation_id;
        }
        outputText = data.answer || "";
        
        // Check for files in Chatflow response
        if (data.files && Array.isArray(data.files)) {
            data.files.forEach((f: any) => {
                if (f.type === 'image' && f.url) {
                    outputFiles.push({ url: f.url, name: f.name });
                }
            });
        }
      }

      // Ensure result is string
      if (typeof outputText !== 'string') {
          outputText = safeStringify(outputText);
      }

      // Append images as Markdown so frontend regex can pick them up
      // deduplicate based on URL
      const uniqueImages = Array.from(new Map(outputFiles.map(item => [item.url, item])).values());
      
      if (uniqueImages.length > 0) {
          const imageMarkdown = uniqueImages.map(f => {
             // Don't append if already in text (Dify might have templated it)
             if (outputText.includes(f.url)) return '';
             return `\n![${f.name || 'image'}](${f.url})`;
          }).join('');
          outputText += imageMarkdown;
      }

      return outputText || "Dify 没有返回内容";
    }

    return "配置错误：未知的模型供应商。";

  } catch (error: any) {
    console.error("Error sending message:", error);
    const errorMsg = safeStringify(error.message || error);
    // Defensive check to ensure we never throw an object
    throw new Error(`(网络连接错误: ${errorMsg})`);
  }
};