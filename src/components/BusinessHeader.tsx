import React from 'react';
import { useAuth } from './AuthProvider';
import { supabase, handleSupabaseError } from '../lib/supabase';

interface BusinessHeaderProps {
  className?: string;
  showContact?: boolean;
  variant?: 'default' | 'invoice';
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export function BusinessHeader({ className = '', showContact = true, variant = 'default' }: BusinessHeaderProps) {
  const [profile, setProfile] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { session } = useAuth();
  const retryTimeoutRef = React.useRef<number>();

  React.useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
    
    return () => {
      // Clean up any pending retry timeouts
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [session]);

  async function fetchProfile(attempt = 0) {
    try {
      setError(null);
      setIsLoading(true);
      
      const data = await handleSupabaseError(
        (async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session!.user.id)
            .single();
          if (error) throw error;
          return { data, error };
        })(),
        MAX_RETRIES,
        INITIAL_RETRY_DELAY
      );
      
      setProfile(data);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setIsLoading(false);
      
      const isNetworkError = err.message?.includes('Network error') || 
                            err.message?.includes('Failed to fetch');
      
      if (isNetworkError && attempt < MAX_RETRIES) {
        const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), 10000);
        setError(`Connection attempt ${attempt + 1}/${MAX_RETRIES}: Retrying in ${delay/1000} seconds...`);
        
        retryTimeoutRef.current = window.setTimeout(() => {
          fetchProfile(attempt + 1);
        }, delay);
      } else {
        setError(
          isNetworkError
            ? 'Unable to connect to the server after multiple attempts. Please check your internet connection and refresh the page.'
            : err.message || 'Failed to load business profile. Please try refreshing the page.'
        );
      }
    }
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 text-center">
        <p className="mb-2">{error}</p>
        {!isLoading && !error.includes('Retrying') && (
          <button
            onClick={() => fetchProfile(0)}
            className="text-sm bg-red-100 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile) return null;

  if (variant === 'invoice') {
    return (
      <div className={`flex flex-col items-center mb-8 ${className}`}>
        {profile.logo_url && (
          <img
            src={profile.logo_url}
            alt="Business logo"
            className="h-24 w-auto object-contain mb-4"
          />
        )}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{profile.business_name}</h2>
          <div className="text-sm text-gray-600 mt-2">
            <p>{profile.address}</p>
            <p>
              <a
                href={`mailto:${profile.business_email}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {profile.business_email}
              </a>
            </p>
            {profile.website && (
              <p>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {profile.website}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {profile.logo_url && (
        <img
          src={profile.logo_url}
          alt="Business logo"
          className="h-16 w-16 object-contain"
        />
      )}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{profile.business_name}</h2>
        {showContact && (
          <div className="text-sm text-gray-600">
            <p>{profile.address}</p>
            <p>{profile.business_email}</p>
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {profile.website}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}