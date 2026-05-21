// <ChatHost /> — mount once at the layout level; renders the AI button, login modal (anon), and slide-over (auth)
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { LoginModal } from "@/components/auth/login-modal";
import { AIButton } from "./ai-button";
import { ChatPanel } from "./chat-panel";

export function ChatHost() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const onClick = () => {
    if (isAuthenticated) {
      setChatOpen(true);
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <>
      <AIButton onClick={onClick} locked={!isAuthenticated} />
      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        pathname={pathname ?? undefined}
      />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="Sign in to chat with AI"
        subtitle="The AI coach uses your saved training data. Free, takes a few seconds."
      />
    </>
  );
}
