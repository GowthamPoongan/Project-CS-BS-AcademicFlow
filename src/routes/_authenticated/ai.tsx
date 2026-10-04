import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Sparkles, Bot } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({ meta: [{ title: "Agentic AI — AcademicFlow" }] }),
  component: AgenticAIPage,
});

const LOGOS = [
  { src: "/ChatGPT.png", alt: "ChatGPT" },
  { src: "/Gemini.png", alt: "Gemini" },
  { src: "/claude.png", alt: "Claude" },
  { src: "/openclaw.png", alt: "OpenClaw" },
];

function AgenticAIPage() {
  return (
    <AppShell 
      title="" 
      subtitle=""
    >
      {/* Desktop View */}
      <div className="hidden sm:flex w-full flex-col items-center justify-center h-[calc(100vh-120px)] px-4 text-center">
        <div 
          className="relative inline-flex justify-center mx-auto" 
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          <img 
            src="/web agentic bg.png" 
            alt="Agentic AI Desktop UI" 
            className="block pointer-events-none rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]"
            style={{ 
              width: '1400px', 
              maxWidth: '100%', 
              maxHeight: 'inherit', 
              height: 'auto' 
            }}
          />
          
          {/* Invisible interactive button placed exactly over the "Create Now" button in the desktop image */}
          <button 
            className="absolute bottom-[18%] left-[39.5%] right-[39.5%] top-[74.5%] rounded-full cursor-pointer transition-colors hover:bg-black/5 active:bg-black/10 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
            aria-label="Create Now"
            onClick={() => {
              // handle click action here
            }}
          >
            <span className="sr-only">Create Now</span>
          </button>
        </div>
      </div>

      {/* Mobile View - Full Screen Takeover */}
      <div className="flex sm:hidden fixed inset-0 z-20 bg-[#0066FF] flex-col items-center">
        <img 
          src="/Agentic AI Bubble App UI.png" 
          alt="Agentic AI Mobile App UI" 
          className="w-full h-full object-cover block pointer-events-none"
        />
        
        {/* Invisible interactive button placed exactly over the "Create Now" button in the image */}
        <button 
          className="absolute bottom-[20.5%] left-[17%] right-[17%] top-[70.5%] rounded-full cursor-pointer transition-colors active:bg-black/20 focus:outline-none focus:ring-4 focus:ring-white/50"
          aria-label="Create Now"
          onClick={() => {
            // handle click action here
          }}
        >
          <span className="sr-only">Create Now</span>
        </button>
      </div>
    </AppShell>
  );
}
