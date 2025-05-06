import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Box, MessageCircle, Settings } from 'lucide-react';

interface Tab {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { to: '/', label: 'Home', icon: <Home size={20} /> },
  { to: '/customers', label: 'Customers', icon: <Users size={20} /> },
  { to: '/invoices', label: 'Invoices', icon: <FileText size={20} /> },
  { to: '/inventory', label: 'Inventory', icon: <Box size={20} /> },
  { to: '/messages', label: 'Messages', icon: <MessageCircle size={20} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="flex justify-around bg-white border-t shadow-lg h-10 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`
          }
        >
          <div className="mb-0.5">
            {tab.icon}
          </div>
          <span className="text-[11px] font-medium leading-tight">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
} 