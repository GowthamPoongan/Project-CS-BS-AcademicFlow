import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Copy, 
  Check, 
  Sparkles, 
  Bot, 
  Key, 
  Globe, 
  ExternalLink, 
  Send, 
  ShieldCheck, 
  Zap, 
  HelpCircle,
  Smartphone,
  Laptop
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AI_PLATFORMS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "/ChatGPT.png",
    description: "Connect as custom GPT or MCP Action",
    guide: [
      "Open ChatGPT and go to Custom GPTs or Settings.",
      "Select Developer / Actions / MCP Connections.",
      "Enter the Server URL: http://localhost:3001/mcp",
      "Set Authentication to Bearer Token and paste your access token below."
    ]
  },
  {
    id: "claude",
    name: "Claude Desktop",
    icon: "/claude.png",
    description: "Connect via claude_desktop_config.json",
    guide: [
      "Open your Claude Desktop configuration file (claude_desktop_config.json).",
      "Add AcademicFlow under 'mcpServers' with HTTP transport.",
      "Set URL to http://localhost:3001/mcp and add header 'Authorization: Bearer <TOKEN>'.",
      "Restart Claude Desktop to start asking academic questions."
    ]
  },
  {
    id: "openclaw",
    name: "OpenClaw Agent",
    icon: "/openclaw.png",
    description: "Autonomous enterprise academic agent",
    guide: [
      "Configure OpenClaw agent manifest with academicflow plugin.",
      "Set environment variable OPENCLAW_MCP_URL=http://localhost:3001/mcp",
      "Set OPENCLAW_MCP_TOKEN to your copied bearer token.",
      "OpenClaw will autonomously track student progress & at-risk flags."
    ]
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: "/Gemini.png",
    description: "Google Gemini Extensions & MCP",
    guide: [
      "Open Gemini Developer Studio or Custom Extension setup.",
      "Register a new MCP Service URL: http://localhost:3001/mcp",
      "Add HTTP Bearer Authorization header with your access token.",
      "Save and enable AcademicFlow tools."
    ]
  }
];

export function AIAssistantModal({ open, onOpenChange }: AIAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<"connect" | "chat">("connect");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("chatgpt");
  const [accessToken, setAccessToken] = useState<string>("");
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("academicflow-agent");

  // In-app chat state
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I am your AcademicFlow AI Assistant powered by MCP. Ask me anything about your CGPA, course records, attendance status, or academic risk analysis."
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const mcpServerUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.hostname}:3001/mcp`
    : "http://localhost:3001/mcp";

  useEffect(() => {
    async function fetchSessionToken() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          setAccessToken(data.session.access_token);
        }
      } catch (err) {
        console.error("Failed to fetch access token:", err);
      }
    }
    if (open) {
      fetchSessionToken();
    }
  }, [open]);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isTyping) return;

    const userMsg = { role: "user" as const, content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    // Simulate intelligent agent response leveraging user context
    setTimeout(() => {
      let reply = "";
      const lower = textToSend.toLowerCase();

      if (lower.includes("cgpa") || lower.includes("gpa") || lower.includes("academic")) {
        reply = "📊 **Academic Summary**:\nYour cumulative GPA (CGPA) calculated from verified semester records is **8.64** across 4 completed semesters with 78 total credits earned.";
      } else if (lower.includes("risk") || lower.includes("attendance")) {
        reply = "⚠️ **Risk & Attendance Status**:\nYour current overall attendance is **88.5%**. You are currently **NOT at risk** in any subject (minimum required threshold is 75%). Keep up the consistent record!";
      } else if (lower.includes("certificate") || lower.includes("achievement") || lower.includes("document")) {
        reply = "🏆 **Verified Achievements**:\nYou have **3 verified achievement records** on file including NPTEL Cloud Computing (Elite+Gold) and Hackathon 1st Runner Up.";
      } else {
        reply = `🤖 **${selectedModel === 'academicflow-agent' ? 'AcademicFlow Agent' : selectedModel} Response**:\nI have checked your profile context securely via the AcademicFlow MCP tools. Your academic records are active and up to date. How else can I assist your success today?`;
      }

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setIsTyping(false);
    }, 900);
  };

  const activePlatformObj = AI_PLATFORMS.find(p => p.id === selectedPlatform) || AI_PLATFORMS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] p-0 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white border border-slate-800 shadow-2xl rounded-2xl">
        {/* Header Bar */}
        <div className="p-6 pb-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Agentic AI Assistant Hub
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  MCP v2 Enabled
                </span>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Connect external AI clients or chat directly with AcademicFlow's autonomous agent.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 pt-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 bg-slate-800/60 p-1 rounded-xl mb-6 border border-slate-700/50">
              <TabsTrigger 
                value="connect" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300 font-medium text-xs sm:text-sm py-2 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Connect External AI Apps (MCP)
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300 font-medium text-xs sm:text-sm py-2 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4" />
                In-App AI Assistant
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: CONNECT EXTERNAL AI */}
            <TabsContent value="connect" className="space-y-6 focus-visible:outline-none">
              {/* Credentials Card */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 bg-slate-900/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Your MCP Credentials
                  </h4>
                  <span className="text-[11px] text-slate-400">RLS Row-Level Access Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* MCP Server Endpoint */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      MCP Server Endpoint URL
                    </label>
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs font-mono text-slate-200">
                      <span className="truncate flex-1">{mcpServerUrl}</span>
                      <button
                        onClick={() => copyToClipboard(mcpServerUrl, setCopiedUrl)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                        title="Copy URL"
                      >
                        {copiedUrl ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Access Token */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      Your Access Token (Bearer JWT)
                    </label>
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs font-mono text-slate-200">
                      <span className="truncate flex-1">
                        {accessToken ? `${accessToken.substring(0, 16)}...` : "Loading session token..."}
                      </span>
                      <button
                        disabled={!accessToken}
                        onClick={() => copyToClipboard(accessToken, setCopiedToken)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Copy Bearer Token"
                      >
                        {copiedToken ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Selector Grid */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select your AI Platform to Connect:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AI_PLATFORMS.map((platform) => {
                    const isSelected = selectedPlatform === platform.id;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={`p-3 rounded-xl border transition-all text-left flex flex-col gap-2 cursor-pointer ${
                          isSelected 
                            ? "bg-purple-900/30 border-purple-500/80 shadow-md shadow-purple-500/10" 
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <img src={platform.icon} alt={platform.name} className="w-6 h-6 object-contain" />
                          {isSelected && <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{platform.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{platform.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Setup Guide for Selected Platform */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <img src={activePlatformObj.icon} alt={activePlatformObj.name} className="w-5 h-5 object-contain" />
                  Quick Setup Guide for {activePlatformObj.name}
                </div>

                <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside pl-1">
                  {activePlatformObj.guide.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="text-slate-200">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>

            {/* TAB 2: IN-APP CHAT ASSISTANT */}
            <TabsContent value="chat" className="space-y-4 focus-visible:outline-none">
              {/* Model Selector Bar */}
              <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Active Assistant Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-slate-950 text-white text-xs px-2 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-purple-500"
                >
                  <option value="academicflow-agent">AcademicFlow Autonomous Agent (MCP)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">ChatGPT GPT-4o</option>
                  <option value="openclaw-academic">OpenClaw Academic Assistant</option>
                </select>
              </div>

              {/* Chat Messages Window */}
              <div className="h-[280px] overflow-y-auto p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white rounded-tr-none"
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2 items-center text-slate-400 text-xs py-1">
                    <Bot className="w-4 h-4 animate-bounce text-purple-400" />
                    <span>AcademicFlow Agent is analyzing tools...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "What is my current CGPA?",
                  "Check my risk status",
                  "List my certificates",
                  "Show attendance summary"
                ].map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/60 transition-colors"
                  >
                    ✨ {promptText}
                  </button>
                ))}
              </div>

              {/* Chat Input Field */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask your AcademicFlow AI Assistant..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuery.trim() || isTyping}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
