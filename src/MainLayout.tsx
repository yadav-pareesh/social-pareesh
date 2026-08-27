import { Outlet } from 'react-router-dom';
import { Navbar } from './components/navbar';
import { useSocket } from './hooks/useSocket';
import { useChatStore } from './stores/chatStore';

export const MainLayout = () => {
  useSocket();
  const { activeConversationId } = useChatStore();
  const isInActiveChat = Boolean(activeConversationId);
  
  return (
    // FIX 1: Changed h-screen to h-[100dvh] to lock to the true mobile viewport
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground antialiased">
      <Navbar />
      <main 
        // FIX 2: Changed overflow-y-auto to overflow-hidden
        // This forces only the MessageList inside the ChatWindow to scroll!
        className={`flex-1 flex flex-col min-w-0 overflow-hidden sm:pb-0 transition-all ${
          isInActiveChat ? 'pb-0' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};