import React, { useState, useEffect } from 'react';
import { 
  Upload, X, FileText, Mail, DollarSign, Save, Globe, Users,
  Shield, Clock, CreditCard, BarChart, Package, AlertCircle, Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { 
  BusinessProfile, GeneralSettings, Subscription, 
  TeamMember, UserRole, ActivityLog, Profile 
} from '../types';

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    address: '',
    email: '',
    businessType: 'both',
    website: ''
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoError, setLogoError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchActivityLogs();
  }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setLogoUrl(data.logo_url || undefined);
      setProfile({
        name: data.business_name || '',
        address: data.address || '',
        email: data.business_email || '',
        businessType: (data.business_type as 'products' | 'services' | 'both') || 'both',
        website: data.website || ''
      });
    }
  }

  async function fetchActivityLogs() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return;
    }

    setActivityLogs(data || []);
  }

  async function handleLogoUpload(file: File) {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Please upload a JPEG, PNG, or PDF file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('File size must be less than 5MB');
      return;
    }

    // Create preview URL for image files
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    } else {
      setLogoPreview(undefined);
    }

    setLogo(file);
    setLogoError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user session');

      let newLogoUrl = logoUrl;

      // Upload new logo if selected
      if (logo) {
        const fileExt = logo.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `business-logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(filePath);

        newLogoUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          business_name: profile.name,
          address: profile.address,
          business_email: profile.email,
          business_type: profile.businessType,
          website: profile.website,
          logo_url: newLogoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Save to localStorage for sidebar
      localStorage.setItem('businessProfile', JSON.stringify({
        ...profile,
        logo_url: newLogoUrl
      }));

      // Cleanup preview URL
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }

      // Refresh the page to update all components
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'general' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'activity' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Activity Logs
        </button>
      </div>

      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Logo
              </label>
              <div className="flex items-center space-x-4">
                {(logoPreview || logoUrl) ? (
                  <div className="relative">
                    <img
                      src={logoPreview || logoUrl}
                      alt="Business logo"
                      className="h-20 w-20 object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl(undefined);
                        setLogoPreview(undefined);
                        setLogo(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-100 rounded-full p-1 text-red-600 hover:bg-red-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer text-gray-600 hover:text-gray-800"
                    >
                      <Upload size={24} />
                    </label>
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Upload your business logo (JPEG, PNG, or PDF, max 5MB)
                  {logoError && (
                    <p className="text-red-600 mt-1">{logoError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Other form fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address/Location
              </label>
              <input
                type="text"
                required
                value={profile.address}
                onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website (Optional)
              </label>
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type
              </label>
              <select
                value={profile.businessType}
                onChange={(e) => setProfile(prev => ({ 
                  ...prev, 
                  businessType: e.target.value as 'products' | 'services' | 'both'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="products">Products-based</option>
                <option value="services">Services-based</option>
                <option value="both">Both Products and Services</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Business Profile'}
          </button>
        </form>
      )}

      {/* Activity Logs */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="mr-2" size={20} />
            Activity Logs
          </h2>

          <div className="space-y-4">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-gray-500">
                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <div className="text-sm text-gray-500">
                      {JSON.stringify(log.details)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}