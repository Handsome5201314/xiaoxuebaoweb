import React, { useState, useEffect } from 'react';
import { Settings, User, Save, X, Cpu, Network, Key, Database, Activity, CheckCircle2, AlertCircle, MessageSquare, GitBranch, BookOpen, Volume2, Smile, Music, Zap } from 'lucide-react';
import { AppSettings, ModelProvider, VoiceTone } from '../types';
import { testConnection } from '../services/geminiService';

interface PersonalCenterProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const PersonalCenter: React.FC<PersonalCenterProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'profile' | 'model'>('model');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  // Reset test status when switching tabs or providers
  useEffect(() => {
    setTestStatus('idle');
    setTestMessage('');
  }, [formData.provider, activeTab, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset test status on modification
    if (testStatus !== 'idle') {
      setTestStatus('idle');
      setTestMessage('');
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('正在连接...');
    const result = await testConnection(formData);
    setTestStatus(result.success ? 'success' : 'error');
    setTestMessage(result.message);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            <h2 className="text-lg font-bold font-['ZCOOL_KuaiLe']">个人中心</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button 
            onClick={() => setActiveTab('model')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'model' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            模型接入
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'profile' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            我的资料
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          
          {activeTab === 'model' && (
            <div className="space-y-6">
              {/* Provider Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">选择大模型供应商</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handleChange('provider', 'gemini')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${formData.provider === 'gemini' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Cpu size={16} />
                    <span>Gemini</span>
                  </button>
                  <button 
                    onClick={() => handleChange('provider', 'openai')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${formData.provider === 'openai' ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Network size={16} />
                    <span>OpenAI/兼容</span>
                  </button>
                  <button 
                    onClick={() => handleChange('provider', 'dify')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${formData.provider === 'dify' ? 'bg-purple-50 border-purple-500 text-purple-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Database size={16} />
                    <span>Dify</span>
                  </button>
                </div>
              </div>

              {/* Gemini Config */}
              {formData.provider === 'gemini' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-600 mb-2">
                    使用 Google 官方 Gemini API。
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">API Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 text-gray-400" size={14} />
                      <input 
                        type="password" 
                        value={formData.geminiKey}
                        onChange={(e) => handleChange('geminiKey', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        placeholder="AIzaSy..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Model Name</label>
                    <input 
                      type="text" 
                      value={formData.geminiModel}
                      onChange={(e) => handleChange('geminiModel', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                      placeholder="gemini-2.5-flash"
                    />
                  </div>
                </div>
              )}

              {/* OpenAI Config */}
              {formData.provider === 'openai' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-green-50 p-3 rounded-lg text-xs text-green-600 mb-2">
                    支持 DeepSeek, SiliconFlow, Moonshot 等兼容 OpenAI 格式的接口。
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Base URL</label>
                    <input 
                      type="text" 
                      value={formData.openaiBaseUrl}
                      onChange={(e) => handleChange('openaiBaseUrl', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                      placeholder="https://api.deepseek.com/v1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">API Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 text-gray-400" size={14} />
                      <input 
                        type="password" 
                        value={formData.openaiKey}
                        onChange={(e) => handleChange('openaiKey', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                        placeholder="sk-..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Model Name</label>
                    <input 
                      type="text" 
                      value={formData.openaiModel}
                      onChange={(e) => handleChange('openaiModel', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                      placeholder="deepseek-chat"
                    />
                  </div>
                </div>
              )}

              {/* Dify Config */}
              {formData.provider === 'dify' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-purple-50 p-3 rounded-lg text-xs text-purple-600 mb-2">
                    连接 Dify 应用。请注意区分 Chat 应用和 Workflow 应用的密钥。
                  </div>
                  
                  {/* App Type Selector */}
                  <div className="grid grid-cols-2 gap-2 mb-1">
                     <button
                       onClick={() => handleChange('difyAppType', 'chat')}
                       className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center justify-center space-x-1 transition-all ${formData.difyAppType === 'chat' || !formData.difyAppType ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}
                     >
                        <MessageSquare size={14} />
                        <span>聊天助手 (Chat)</span>
                     </button>
                     <button
                       onClick={() => handleChange('difyAppType', 'workflow')}
                       className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center justify-center space-x-1 transition-all ${formData.difyAppType === 'workflow' ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}
                     >
                        <GitBranch size={14} />
                        <span>工作流 (Workflow)</span>
                     </button>
                  </div>
                  <div className="text-[10px] text-gray-400 mb-2 px-1 leading-tight">
                    注意：如果您的应用类型是 Chatflow / Agent (即便包含工作流编排)，请选择 [聊天助手]。只有类型为纯 "Workflow" 的应用才选择 [工作流]。
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">API Base URL</label>
                    <input 
                      type="text" 
                      value={formData.difyBaseUrl}
                      onChange={(e) => handleChange('difyBaseUrl', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                      placeholder="https://api.dify.ai/v1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">API Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 text-gray-400" size={14} />
                      <input 
                        type="password" 
                        value={formData.difyKey}
                        onChange={(e) => handleChange('difyKey', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                        placeholder={formData.difyAppType === 'workflow' ? "workflow-..." : "app-..."}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* System Instruction & Voice Tone - Only for Gemini/OpenAI */}
              {formData.provider !== 'dify' && (
                 <div className="space-y-4 pt-2 border-t border-dashed border-gray-200">
                    
                    {/* Voice Tone Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                        <Volume2 size={12} className="mr-1" />
                        小雪宝音色 (TTS & 电话)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleChange('voiceTone', 'standard')} 
                          className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1 ${formData.voiceTone === 'standard' || !formData.voiceTone ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                        >
                          <Smile size={14} /> <span>标准 (温暖)</span>
                        </button>
                        <button 
                          onClick={() => handleChange('voiceTone', 'cute')} 
                          className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1 ${formData.voiceTone === 'cute' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                        >
                          <Zap size={14} /> <span>可爱 (皮卡丘)</span>
                        </button>
                        <button 
                          onClick={() => handleChange('voiceTone', 'gentle')} 
                          className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1 ${formData.voiceTone === 'gentle' ? 'bg-pink-50 border-pink-400 text-pink-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                        >
                          <Music size={14} /> <span>轻柔 (舒缓)</span>
                        </button>
                        <button 
                          onClick={() => handleChange('voiceTone', 'deep')} 
                          className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1 ${formData.voiceTone === 'deep' ? 'bg-gray-100 border-gray-400 text-gray-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                        >
                          <Volume2 size={14} /> <span>低沉 (稳重)</span>
                        </button>
                      </div>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                          <BookOpen size={12} className="mr-1" />
                          角色设定 (System Prompt)
                        </label>
                        <textarea
                          value={formData.systemInstruction}
                          onChange={(e) => handleChange('systemInstruction', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none h-20 leading-relaxed resize-none"
                          placeholder="在此定义智能体的角色、语气和规则..."
                        />
                    </div>
                 </div>
              )}

              {/* Test Connection Section */}
              <div className="pt-2 flex flex-col items-start">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50"
                >
                  <Activity size={14} className={`mr-1.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                  测试连接
                </button>
                
                {testStatus !== 'idle' && (
                  <div className={`mt-2 text-xs flex items-center p-2 rounded-lg w-full ${
                    testStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}>
                      {testStatus === 'success' ? <CheckCircle2 size={14} className="mr-2 shrink-0" /> : <AlertCircle size={14} className="mr-2 shrink-0" />}
                      <span className="break-all">{testMessage}</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
               <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mb-2">
                  <User size={40} />
               </div>
               <h3 className="font-bold text-gray-700">冒险者</h3>
               <p className="text-sm text-gray-500 px-4">
                 在这里，你的每一次对话都是一次成长的冒险。保持勇敢！
               </p>
               <div className="text-xs text-gray-400 mt-8">
                 Version 0.6.2
               </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50">
          <button 
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-95"
          >
            <Save size={18} />
            <span>保存配置</span>
          </button>
        </div>

      </div>
    </div>
  );
};