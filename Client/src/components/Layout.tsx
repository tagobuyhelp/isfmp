import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, CreditCard, Heart, Menu, X, Bell, UserCog, Map } from 'lucide-react';
import UserMenu from './UserMenu';
import Clock from './Clock';
import Stopwatch from './Stopwatch';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/members', icon: Users, label: 'Members' },
    { path: '/memberships', icon: CreditCard, label: 'Memberships' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/donations', icon: Heart, label: 'Donations' },
    { path: '/notices', icon: Bell, label: 'Notices' },
    { path: '/users', icon: UserCog, label: 'Users' },
    { path: '/locations', icon: Map, label: 'Locations' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-gradient-to-b from-primary-800 to-primary-700 w-64 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="text-white">
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-100 to-primary-100 bg-clip-text text-transparent">
                ISF Membership Portal
              </h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-2 py-3 border-t border-primary-600/50">
            <Clock />
          </div>

          <div className="px-2 py-3 border-t border-primary-600/50">
            <Stopwatch />
          </div>

          <nav className="space-y-1.5 flex-grow mt-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-gray-300 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-900/50' 
                      : 'hover:bg-primary-600/50'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-primary-600/50 mt-auto">
            <UserMenu />
          </div>
        </div>
      </aside>

      <div className={`p-4 md:ml-64`}>
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white rounded-lg shadow-sm"
          >
            <Menu size={24} />
          </button>
        </div>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;