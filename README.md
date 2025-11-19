# ❄️ 小雪宝 (Little Snowball / LeukemiaPal)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.5-8E75B2.svg)
![Taro](https://img.shields.io/badge/Framework-Taro-0000C2.svg)

[English](#english) | [中文](#chinese)

---

<a name="chinese"></a>

## 📖 项目介绍 (Introduction)

**小雪宝 (LeukemiaPal)** 是一个专为白血病患儿及其家庭设计的**游戏化智能医疗助手**。

它不仅仅是一个聊天机器人，更是一个**勇敢的伙伴**。通过温暖的卡通形象、游戏化的成就系统和先进的 AI 技术，小雪宝致力于缓解患儿治疗过程中的恐惧与焦虑，提供专业的科普知识，并时刻关注孩子的情绪变化。

> 🌟 **核心使命**：用 AI 的温度，守护每一个勇敢的小天使。

## ✨ 核心功能 (Features)

### 1. 🤖 情感化 AI 陪伴
- **动态形象**：小雪宝会根据对话内容表现出开心、关心、思考等不同表情。
- **角色扮演**：内置精心设计的 System Prompt，始终以温和、坚韧、鼓励的语气与孩子交流。
- **记忆画像**：自动分析对话历史，生成用户画像（Summary & Tags），记住孩子的喜好和状态。

### 2. 📞 实时语音通话 (Gemini Live)
- **沉浸式通话**：利用 Google Gemini Live API，实现低延迟的实时语音对话。
- **可打断**：模拟真实人类交流，支持随时打断 AI 发言。
- **多音色支持**：支持切换“皮卡丘/可爱”、“稳重”、“轻柔”等多种音色。

### 3. 🎮 游戏化激励系统
- **成就系统**：通过互动（如第一次提问、询问饮食建议）解锁成就徽章。
- **勇气星**：每次对话都能收集“勇气星”，提升健康等级。
- **随机事件**：模拟突发状况（如发烧、想家），引导孩子学习应对方法。

### 4. 🔌 强大的模型接入能力
- **多模型支持**：
  - **Google Gemini**: 官方支持，包含 Live 语音功能。
  - **OpenAI 兼容接口**: 支持 DeepSeek, SiliconFlow, Moonshot 等。
  - **Dify**: 支持接入 Dify 的 Chatflow 和 Workflow 应用。
- **可视化配置**：在“个人中心”轻松配置 API Key 和 Base URL。

### 5. 📱 多端支持架构
- 基于 **Taro** 框架构建，代码结构支持编译为 **微信小程序** 和 H5 网页。

## 🛠️ 技术栈 (Tech Stack)

- **前端框架**: React 19, Taro
- **样式**: Tailwind CSS
- **AI SDK**: `@google/genai` (Gemini 2.5 Flash / Pro)
- **图标库**: Lucide React
- **语音技术**: Web Audio API (PCM Encoding/Decoding), SpeechSynthesis API

## 🚀 快速开始 (Getting Started)

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/little-snowball.git
cd little-snowball
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 配置模型
启动后点击右上角的 **设置 (⚙️)** 图标，进入“模型接入”页面：
- 选择 **Gemini** 并输入 API Key (推荐用于体验完整功能)。
- 或配置 OpenAI / Dify 信息。

---

<a name="english"></a>

## 📖 Introduction

**Little Snowball (LeukemiaPal)** is a **gamified intelligent medical assistant** designed specifically for children with leukemia and their families.

More than just a chatbot, it is a **brave companion**. Through a warm cartoon avatar, gamified achievement systems, and advanced AI technology, Little Snowball aims to alleviate fear and anxiety during treatment, provide professional popular science knowledge, and always pay attention to the child's emotional changes.

> 🌟 **Mission**: Guarding every brave little angel with the warmth of AI.

## ✨ Key Features

### 1. 🤖 Emotional AI Companionship
- **Dynamic Avatar**: Snowball reacts with different expressions (happy, concerned, thinking) based on the context.
- **Persona**: Built-in carefully designed System Prompts ensuring a gentle, resilient, and encouraging tone.
- **User Profiling**: Automatically analyzes chat history to generate a user persona (Summary & Tags), remembering the child's preferences and status.

### 2. 📞 Real-time Voice Call (Gemini Live)
- **Immersive Calling**: Uses Google Gemini Live API for low-latency, real-time voice conversations.
- **Interruptible**: Supports natural interruption of the AI's speech, simulating real human interaction.
- **Multi-Voice**: Switch between "Cute/Pikachu", "Deep", or "Gentle" voice tones.

### 3. 🎮 Gamification System
- **Achievements**: Unlock badges through interactions (e.g., first question, asking for dietary advice).
- **Bravery Stars**: Collect stars with every conversation to level up.
- **Random Events**: Simulated scenarios (e.g., fever, homesickness) to guide children on how to cope.

### 4. 🔌 Multi-Model Support
- **Google Gemini**: Official support, including Live Voice features.
- **OpenAI Compatible**: Supports DeepSeek, SiliconFlow, Moonshot, etc.
- **Dify**: Supports connecting to Dify Chatflow and Workflow apps.

### 5. 📱 Multi-Platform Architecture
- Built on the **Taro** framework, the codebase supports compilation to **WeChat Mini Programs** and H5 Web.

## 🚀 Quick Start

1.  **Clone the repo**: `git clone ...`
2.  **Install dependencies**: `npm install`
3.  **Run dev server**: `npm run dev`
4.  **Configure AI**: Open Settings (⚙️), select **Gemini**, and paste your API Key.

## 📄 License

MIT License
