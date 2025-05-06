import { useEffect } from 'react';
import { Zap } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#001F3F] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="flex items-center justify-center mb-4">
          <Zap size={48} className="text-white" />
        </div>
        <h1 className="text-5xl font-bold text-white tracking-wider font-sans">
          FastCRM
        </h1>
      </div>
    </div>
  );
}