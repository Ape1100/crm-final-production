import { useState, useEffect } from 'react';
import { Bell, Volume2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NotificationSettings {
  email_notifications: boolean;
  sound_notifications: boolean;
  visual_notifications: boolean;
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    sound_notifications: true,
    visual_notifications: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          email_notifications: data.email_notifications,
          sound_notifications: data.sound_notifications,
          visual_notifications: data.visual_notifications
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  }

  async function updateSettings(key: keyof NotificationSettings) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ [key]: !settings[key] })
        .not('id', 'is', null);

      if (error) throw error;
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">
                Receive notifications via email
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.email_notifications}
              onChange={() => updateSettings('email_notifications')}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Volume2 className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Sound Notifications</p>
              <p className="text-sm text-gray-500">
                Play sound for new notifications
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.sound_notifications}
              onChange={() => updateSettings('sound_notifications')}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Visual Notifications</p>
              <p className="text-sm text-gray-500">
                Show visual alerts for notifications
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.visual_notifications}
              onChange={() => updateSettings('visual_notifications')}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}