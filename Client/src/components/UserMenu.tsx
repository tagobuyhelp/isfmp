import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const logoutPromise = new Promise(async (resolve, reject) => {
      try {
        await logout();
        resolve('Logged out successfully');
      } catch (error) {
        reject(error instanceof Error ? error.message : 'Logout failed');
      }
    });

    toast.promise(logoutPromise, {
      loading: 'Logging out...',
      success: 'See you soon!',
      error: 'Logout failed',
    });
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-gray-300 hover:text-white w-full p-2 rounded-lg transition-colors hover:bg-primary-700/50"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-lg">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block text-left flex-1">
          <div className="text-sm font-medium">{user.fullname}</div>
          <div className="text-xs text-primary-300">{user.email}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-primary-300" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200">
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3 text-gray-400" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;