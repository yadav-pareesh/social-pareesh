import { Outlet } from 'react-router-dom';
import { Navbar } from './components/navbar';
import { useSocket } from './hooks/useSocket';
import { useChatStore } from './stores/chatStore';

export const MainLayout = () => {
  useSocket();
  const { activeConversationId } = useChatStore();
  const isInActiveChat = Boolean(activeConversationId);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground antialiased">
      <Navbar />
      <main 
        className={`flex-1 flex flex-col min-w-0 overflow-y-auto sm:pb-0 transition-all ${
          isInActiveChat ? 'pb-0' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};