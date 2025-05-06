import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, Package, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { BusinessProfile } from '../types';

export function Sidebar() {
  const location = useLocation();
  const [businessName, setBusinessName] = useState('SimpleCRM');
  const [showInventory, setShowInventory] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  useEffect(() => {
    const profile = localStorage.getItem('businessProfile');
    if (profile) {
      const businessProfile: BusinessProfile = JSON.parse(profile);
      setBusinessName(businessProfile.name);
      setShowInventory(businessProfile.subscription !== 'basic');
    }

    // Subscribe to messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    fetchUnreadCount();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUnreadCount() {
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);

      setUnreadMessages(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: FileText, label: 'Invoices', path: '/invoices' },
    ...(showInventory ? [{ icon: Package, label: 'Inventory', path: '/inventory' }] : []),
    { 
      icon: MessageSquare, 
      label: 'Messages', 
      path: '/messages',
      badge: unreadMessages > 0 ? unreadMessages : undefined
    },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-800">{businessName}</h1>
      </div>
      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-lg mb-2 ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon size={20} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}