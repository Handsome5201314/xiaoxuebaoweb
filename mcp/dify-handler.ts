import fetch from 'node-fetch';
import { Buffer } from 'node:buffer';

// Configuration Types
interface DifyConfig {
  apiKey: string;
  baseUrl: string;
  appType: 'chat' | 'workflow';
}

// Helper to get config from Env
const getConfig = (): DifyConfig => {
  const apiKey = process.env.DIFY_API_KEY;
  const baseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
  const appType = (process.env.DIFY_APP_TYPE as 'chat' | 'workflow') || 'chat';

  if (!apiKey) {
    throw new Error("Missing DIFY_API_KEY in environment variables");
  }

  return { apiKey, baseUrl, appType };
};

// Result Interface
interface ProcessedResult {
  text: string;
  images: {
    base64: string;
    mimeType: string;
    originalUrl: string;
  }[];
}

// Helper: Convert URL to Base64 (Node.js version)
async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    console.error(`[MCP] Downloading image: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    
    return { base64, mimeType };
  } catch (e) {
    console.error(`[MCP] Error converting image to base64:`, e);
    return null;
  }
}

// Helper: Recursively extract image URLs from Dify outputs object
function extractImageUrls(obj: any, foundUrls: Set<string>) {
  if (!obj) return;

  // Case 1: Dify File Object
  if (typeof obj === 'object' && obj.type === 'image' && obj.url) {
    foundUrls.add(obj.url);
    return;
  }

  // Case 2: Array (e.g. generated files)
  if (Array.isArray(obj)) {
    obj.forEach(item => extractImageUrls(item, foundUrls));
    return;
  }

  // Case 3: Nested Object
  if (typeof obj === 'object') {
    Object.values(obj).forEach(val => extractImageUrls(val, foundUrls));
  }
}

// Main Function
export async function callDifyAndProcessImages(query: string, userId: string): Promise<ProcessedResult> {
  const config = getConfig();
  const isWorkflow = config.appType === 'workflow';
  const endpoint = isWorkflow 
    ? `${config.baseUrl.replace(/\/$/, '')}/workflows/run`
    : `${config.baseUrl.replace(/\/$/, '')}/chat-messages`;

  const body = isWorkflow 
    ? {
        inputs: { query, text: query, question: query },
        response_mode: "blocking",
        user: userId
      }
    : {
        inputs: {},
        query: query,
        response_mode: "blocking",
        user: userId,
        auto_generate_name: false
      };

  console.error(`[MCP] Calling Dify API: ${endpoint}`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dify API Error (${response.status}): ${text}`);
  }

  const data: any = await response.json();
  
  let textResponse = "";
  const imageUrls = new Set<string>();

  // --- Response Parsing Logic (Mirrors geminiService.ts) ---

  if (isWorkflow) {
    const outputs = data.data?.outputs || {};
    
    // 1. Get Text
    textResponse = outputs.text || outputs.answer || outputs.result || outputs.content || outputs.response || "";
    if (!textResponse && Object.keys(outputs).length === 1 && typeof Object.values(outputs)[0] === 'string') {
       textResponse = Object.values(outputs)[0] as string;
    }

    // 2. Extract Images from Output Variables
    extractImageUrls(outputs, imageUrls);

  } else {
    // Chatflow
    textResponse = data.answer || "";
    
    // Chatflow Files
    if (data.files && Array.isArray(data.files)) {
      data.files.forEach((f: any) => {
        if (f.type === 'image' && f.url) imageUrls.add(f.url);
      });
    }
  }

  // 3. Fallback: Parse Markdown Images in textResponse (![alt](url))
  const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = markdownImageRegex.exec(textResponse)) !== null) {
    if (match[1]) imageUrls.add(match[1]);
  }

  // 4. Fallback: Parse Raw URLs in textResponse if they look like images
  const rawUrlRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/gi;
  while ((match = rawUrlRegex.exec(textResponse)) !== null) {
      if(match[1]) imageUrls.add(match[1]);
  }

  // --- Process Images (Download & Convert) ---
  const processedImages: { base64: string, mimeType: string, originalUrl: string }[] = [];
  
  for (const url of imageUrls) {
    // Skip if it's a relative URL without base (Dify sometimes does this, assume absolute for now or skip)
    if (!url.startsWith('http')) continue;

    const imageData = await urlToBase64(url);
    if (imageData) {
      processedImages.push({
        ...imageData,
        originalUrl: url
      });
    }
  }

  return {
    text: textResponse,
    images: processedImages
  };
}