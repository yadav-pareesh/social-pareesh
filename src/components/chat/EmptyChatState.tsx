import { MessageSquare, Lock } from 'lucide-react';

export const EmptyChatState = () => {
  return (
    <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/50 border-l border-border/30 h-full w-full">
      <div className="max-w-md w-full flex flex-col items-center text-center px-8">
        
        {/* Main Brand Icon */}
        <div className="h-32 w-32 bg-primary/5 rounded-full flex items-center justify-center mb-8 ring-1 ring-primary/10">
          <MessageSquare className="h-12 w-12 text-primary/60" strokeWidth={1.5} />
        </div>

        {/* Welcome Text */}
        <h2 className="text-3xl font-light text-foreground mb-3 tracking-tight">
          Welcome to Chats
        </h2>
        <p className="text-muted-foreground mb-10 text-[15px] leading-relaxed">
          Send, receive, and manage your messages directly from the web.<br/>
          Select a conversation from the sidebar to get started.
        </p>

        {/* Trust & Security Badge */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-12 bg-accent/30 px-3 py-1.5 rounded-full">
          <Lock className="h-3.5 w-3.5" />
          <span>Your personal messages are securely encrypted</span>
        </div>        
      </div>
    </div>
  );
};