import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { AIAssistantModal } from "@/components/app/ai-assistant-modal";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({ meta: [{ title: "Agentic AI — AcademicFlow" }] }),
  component: AgenticAIPage,
});

function AgenticAIPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <AppShell 
      title="" 
      subtitle=""
    >
      {/* Desktop View */}
      <div className="hidden sm:flex w-full flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 text-center py-6">
        <div 
          className="relative inline-flex justify-center mx-auto cursor-pointer group" 
          onClick={() => setModalOpen(true)}
        >
          <img 
            src="/web agentic bg.png" 
            alt="Agentic AI Desktop UI" 
            className="block pointer-events-auto rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-[1.01]"
            style={{ 
              width: '1400px', 
              maxWidth: '100%', 
              maxHeight: 'calc(100vh - 140px)', 
              height: 'auto' 
            }}
          />
          
          {/* Overlay highlight on hover indicating clickable area */}
          <div className="absolute inset-0 rounded-[2rem] bg-purple-600/0 group-hover:bg-purple-600/5 transition-colors pointer-events-none flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-2xl border border-purple-500/40 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              Click to Open AI Assistant & MCP Settings
            </div>
          </div>

          {/* Dedicated clickable area over the "Create Now" button in desktop image */}
          <button 
            type="button"
            className="absolute bottom-[16%] left-[38%] right-[38%] top-[72%] rounded-full cursor-pointer z-10 transition-all hover:bg-purple-500/20 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
            aria-label="Create Now"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
          >
            <span className="sr-only">Create Now</span>
          </button>
        </div>
      </div>

      {/* Mobile View - Full Screen Takeover */}
      <div 
        className="flex sm:hidden fixed inset-0 z-20 bg-[#0066FF] flex-col items-center cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        <img 
          src="/Agentic AI Bubble App UI.png" 
          alt="Agentic AI Mobile App UI" 
          className="w-full h-full object-cover block pointer-events-auto"
        />
        
        {/* Dedicated interactive button placed over "Create Now" in mobile image */}
        <button 
          type="button"
          className="absolute bottom-[18%] left-[15%] right-[15%] top-[68%] rounded-full cursor-pointer z-30 transition-all active:bg-white/30 focus:outline-none focus:ring-4 focus:ring-white/50"
          aria-label="Create Now"
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
        >
          <span className="sr-only">Create Now</span>
        </button>
      </div>

      {/* Floating Quick Trigger Button */}
      <button 
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-5 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border border-purple-400/30 cursor-pointer text-xs sm:text-sm"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        Open AI Assistant & MCP Hub
      </button>

      {/* Dual-Mode AI Connection & Chat Modal */}
      <AIAssistantModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppShell>
  );
}

