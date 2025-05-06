import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar: only visible on md+ screens */}
      <aside className="hidden md:block w-64 bg-white border-r fixed h-full">
        <Sidebar />
      </aside>
      {/* Main content: full width on mobile, with left margin on desktop */}
      <main className="flex-1 w-full md:ml-64 p-4 md:p-6 lg:p-8 overflow-x-auto overflow-y-auto">
        <Outlet />
      </main>
      {/* Bottom nav: only visible on mobile (sm and below) */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-white border-t">
        <BottomNav />
      </div>
    </div>
  );
};