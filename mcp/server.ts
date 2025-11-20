import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { callDifyAndProcessImages } from "./dify-handler.js";
import dotenv from "dotenv";
import WebSocket from "ws";
import { EventEmitter } from "events";

// Load environment variables
dotenv.config();

// --- WebSocket Client Transport for XiaoZhi ---
// Since XiaoZhi acts as a WebSocket Server, we need a Transport that acts as a WebSocket Client.
class WebSocketClientTransport implements Transport {
  private _ws: WebSocket | null = null;
  private _url: string;
  
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(url: string) {
    this._url = url;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._ws = new WebSocket(this._url);
      
      this._ws.onopen = () => {
        console.error(`[MCP] Connected to XiaoZhi via WebSocket`);
        resolve();
      };

      this._ws.onerror = (err) => {
        console.error(`[MCP] WebSocket Error:`, err.message);
        if (this.onerror) this.onerror(err);
        reject(err);
      };

      this._ws.onclose = () => {
        console.error(`[MCP] WebSocket Closed`);
        if (this.onclose) this.onclose();
      };

      this._ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString());
          if (this.onmessage) {
            this.onmessage(data);
          }
        } catch (e) {
          console.error(`[MCP] Failed to parse message:`, e);
        }
      };
    });
  }

  async close(): Promise<void> {
    this._ws?.close();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(message));
    } else {
      throw new Error("WebSocket is not open");
    }
  }
}


// --- Initialize MCP Server ---
const server = new McpServer({
  name: "Little Snowball (LeukemiaPal)",
  version: "1.0.0",
});

// Define the tool for XiaoZhi to call
server.tool(
  "consult_snowball",
  {
    query: z.string().describe("The user's question or request about medical advice, companionship, or image generation."),
    user_id: z.string().optional().describe("Unique identifier for the user to maintain conversation context.")
  },
  async ({ query, user_id }) => {
    console.error(`[MCP] Received query: ${query}`); 

    try {
      // Call Dify and get processed results (Text + Base64 Images)
      const result = await callDifyAndProcessImages(query, user_id || "mcp-default-user");

      // Construct MCP Content Array
      const content: any[] = [];

      // 1. Add Text Response
      if (result.text) {
        content.push({
          type: "text",
          text: result.text
        });
      }

      // 2. Add Images (if any)
      if (result.images && result.images.length > 0) {
        for (const img of result.images) {
          content.push({
            type: "image",
            data: img.base64,
            mimeType: img.mimeType
          });
        }
      }

      return {
        content: content
      };

    } catch (error: any) {
      console.error("[MCP] Error processing request:", error);
      return {
        content: [{
          type: "text",
          text: `Error consulting Snowball: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Start the server
async function main() {
  const xiaozhiUrl = process.env.XIAOZHI_MCP_URL;

  if (xiaozhiUrl && xiaozhiUrl.startsWith("ws")) {
    // Use WebSocket Client Transport to connect to XiaoZhi
    const transport = new WebSocketClientTransport(xiaozhiUrl);
    await server.connect(transport);
    console.error(`Little Snowball MCP Client running... connecting to ${xiaozhiUrl}`);
  } else {
    // Default to Stdio for local Claude Desktop use
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Little Snowball MCP Server running on Stdio...");
  }
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  (process as any).exit(1);
});