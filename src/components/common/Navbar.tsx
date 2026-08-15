import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Moon, Sun, LogOut, Menu } from 'lucide-react';
import { Avatar } from './Avatar';
import { BreadcrumbCompact } from './Breadcrumb';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDarkMode, setDarkMode, toggleSidebar } = useUIStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main Navbar */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="inline-flex lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1
            className="cursor-pointer text-xl font-bold hover:opacity-80 transition"
          >
            Chatly
          </h1>

          {/* Back Button */}
          <div className="px-4 py-1">
            <BreadcrumbCompact />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!isDarkMode)}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <div className="flex items-center gap-2">
            {user ? (
              <div
                onClick={handleProfile}
                className="cursor-pointer flex items-center gap-2"
              >
                <Avatar
                  user={user}
                  size="sm"
                  showOnlineIndicator={false}
                  className="flex-shrink-0"
                />
              </div>
            ) : null}

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-muted rounded-lg transition"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};