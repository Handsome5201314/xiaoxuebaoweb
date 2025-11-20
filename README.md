# ❄️ 小雪宝 (Little Snowball / LeukemiaPal)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.5-8E75B2.svg)
![MCP](https://img.shields.io/badge/Protocol-MCP-green.svg)

[English](#english) | [中文](#chinese)

---

<a name="chinese"></a>

## 📖 项目介绍 (Introduction)

**小雪宝 (LeukemiaPal)** 是一个专为白血病患儿及其家庭设计的**游戏化智能医疗助手**。

它不仅仅是一个聊天机器人，更是一个**勇敢的伙伴**。通过温暖的卡通形象、游戏化的成就系统和先进的 AI 技术，小雪宝致力于缓解患儿治疗过程中的恐惧与焦虑，提供专业的科普知识，并时刻关注孩子的情绪变化。

> 🌟 **核心使命**：用 AI 的温度，守护每一个勇敢的小天使。

## ✨ 核心功能 (Features)

### 1. 🔗 MCP 协议支持 (Model Context Protocol) **(New!)**
- **小智互通**：支持作为 MCP Server 运行，允许 **小智** 等硬件或 AI 代理调用小雪宝的医疗知识库。
- **图片传输**：当 Dify 工作流生成图片（如器官示意图、文生图）时，MCP 服务会自动将图片转码传输给小智，实现跨端图片查看。

### 2. 🤖 情感化 AI 陪伴
- **动态形象**：小雪宝会根据对话内容表现出开心、关心、思考等不同表情。
- **角色扮演**：内置精心设计的 System Prompt，始终以温和、坚韧、鼓励的语气与孩子交流。

### 3. 📞 实时语音通话 (Gemini Live)
- **沉浸式通话**：利用 Google Gemini Live API，实现低延迟的实时语音对话。

### 4. 🎮 游戏化激励系统
- **成就系统**：通过互动解锁成就徽章，收集“勇气星”。

### 5. 🔌 强大的模型接入能力
- 支持 **Google Gemini**, **SiliconFlow**, **OpenAI**, **Dify**。

## 🚀 快速开始 (Web App)

1. **进入项目目录**:
   ```bash
   cd little-snowball
   ```

2. **安装依赖**:
   ```bash
   npm install
   ```

3. **启动**:
   ```bash
   npm run dev
   ```

## 🔌 MCP Server 运行指南 (For 小智/Claude)

如果您想让其他 AI 客户端（如小智）连接小雪宝：

1. **配置环境变量**:
   在项目根目录创建 `.env` 文件：
   ```env
   DIFY_API_KEY=你的dify_api_key
   DIFY_BASE_URL=https://api.dify.ai/v1
   DIFY_APP_TYPE=chat  # 或 workflow
   ```

2. **启动 MCP Server**:
   ```bash
   npm run mcp:start
   ```
   该命令会启动一个基于 Stdio 的 MCP 服务。

3. **在 Claude Desktop / 小智 中配置**:
   ```json
   {
     "mcpServers": {
       "snowball": {
         "command": "node",
         "args": ["path/to/little-snowball/mcp/server.ts"]
       }
     }
   }
   ```

---

<a name="english"></a>

## 📖 Introduction

**Little Snowball (LeukemiaPal)** is a **gamified intelligent medical assistant** designed specifically for children with leukemia and their families.

## ✨ Key Features

### 1. 🔗 MCP Support (Model Context Protocol) **(New!)**
- **Interoperability**: Runs as an MCP Server, allowing hardware like **XiaoZhi** to consult Snowball.
- **Image Transport**: Automatically handles Dify image URLs, converting them to Base64 for MCP clients to display.

## 🚀 Web App Quick Start

1. **Enter Project Directory**:
   ```bash
   cd little-snowball
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```

## 🚀 MCP Server Guide

To allow external agents to consult Snowball:

1. Create `.env` with your Dify credentials.
2. Run `npm run mcp:start`.
3. Configure your MCP Client to point to this script.

## 📄 License

MIT License