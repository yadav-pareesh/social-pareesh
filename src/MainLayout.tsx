import { Outlet } from 'react-router-dom';
import { Navbar } from './components/navbar';
import { useSocket } from './hooks/useSocket';

export const MainLayout = () => {
  useSocket();
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground antialiased">
      <Navbar />
      <main className="flex-1 flex overflow-hidden min-w-0">
        <Outlet />
      </main>
    </div>
  );
};