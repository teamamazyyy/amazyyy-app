'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getProfile, updateProfile } from './profile';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const RELOAD_LOCK_KEY = 'auth_reload_lock';
  const LOCK_TIMEOUT = 2000; // 2 seconds

  const acquireReloadLock = () => {
    const now = Date.now();
    const lastReload = localStorage.getItem(RELOAD_LOCK_KEY);
    
    if (!lastReload || now - parseInt(lastReload) > LOCK_TIMEOUT) {
      localStorage.setItem(RELOAD_LOCK_KEY, now.toString());
      return true;
    }
    return false;
  };

  // Fetch or create user profile
  const fetchOrCreateProfile = async (userId) => {
    console.log('Fetching or creating profile for user:', userId);
    let userProfile = await getProfile(userId);
    console.log('Existing profile:', userProfile);
    
    // If profile doesn't exist, create it
    if (!userProfile) {
      console.log('No existing profile, creating new one');
      const { data: userData } = await supabase.auth.getUser();
      const { user } = userData;
      console.log('User data:', user);
      
      const newProfile = {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        theme: 'light'
      };
      
      console.log('Attempting to create profile:', newProfile);
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }
      console.log('Successfully created profile:', profile);
      userProfile = profile;
    } else {
      // Update existing profile with latest Google data if available
      const { data: userData } = await supabase.auth.getUser();
      const { user } = userData;
      
      if (user?.user_metadata) {
        const updates = {
          full_name: user.user_metadata.name || user.user_metadata.full_name || userProfile.full_name,
          // Only use Google avatar if user hasn't set a custom one
          avatar_url: userProfile.avatar_url || user.user_metadata.avatar_url || user.user_metadata.picture
        };
        
        // Only update if there are changes and we're not overriding a custom avatar
        if (updates.full_name !== userProfile.full_name || 
            (!userProfile.avatar_url && updates.avatar_url !== userProfile.avatar_url)) {
          const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
            
          if (!error) {
            userProfile = updatedProfile;
          }
        }
      }
    }

    setProfile(userProfile);
    return userProfile;
  };

  // Handle auth state change
  const handleAuthChange = async (session) => {
    setLoading(true);
    try {
      if (session?.user) {
        setUser(session.user);
        await fetchOrCreateProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error handling auth change:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const setupAuth = async () => {
      try {
        // First check for an existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession && isMounted) {
          await handleAuthChange(existingSession);
        }

        // Then set up the listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (isMounted) {
            if (session) {
              if (event === 'SIGNED_IN') {
                // Only reload if we acquire the lock
                if (acquireReloadLock()) {
                  window.location.reload();
                  return;
                }
              }
              await handleAuthChange(session);
            } else {
              setUser(null);
              setProfile(null);
            }
          }
        });

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up auth:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setupAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        flowType: 'pkce'
      }
    });
    if (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clear user preferences from localStorage
      localStorage.removeItem('easy_jp_news_preferences');
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) {
      return null;
    }
    const updatedProfile = await updateProfile(user.id, updates);
    if (updatedProfile) {
      setProfile(updatedProfile);
    }
    return updatedProfile;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signInWithGoogle,
      signOut,
      updateProfile: updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 
