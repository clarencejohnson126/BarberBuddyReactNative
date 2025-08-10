// Authentication Context for BarberBuddy
// Manages user authentication state

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createSupabaseService } from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseService = createSupabaseService();

  useEffect(() => {
    // Get initial session and subscribe to auth state changes
    const initSession = async () => {
      try {
        console.log('🔄 AuthContext.initSession() checking for existing session...');
        const initialSession = await supabaseService.getCurrentSession();
        
        console.log('🔍 AUTHCONTEXT SESSION DIAGNOSTIC:', {
          hasSession: !!initialSession,
          hasUser: !!initialSession?.user,
          userEmail: initialSession?.user?.email,
          sessionId: initialSession?.access_token?.substring(0, 20) + '...',
          expiresAt: initialSession?.expires_at,
          refreshToken: initialSession?.refresh_token?.substring(0, 20) + '...',
          fullSession: initialSession
        });
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.log('❌ AuthContext.initSession() error:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const authListener = supabaseService.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'signed out');
        console.log('🔄 Auth state details:', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email,
        });

        // Update state for all events
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        console.log('🔄 Auth state updated:', {
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          loading: false
        });
      }
    );

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🚪 AuthContext.signOut() starting logout process...');
      // Clear state optimistically
      console.log('🚪 AuthContext.signOut() clearing auth state immediately...');
      setUser(null);
      setSession(null);
      setLoading(false);
      
      // Call Supabase signOut
      const result = await supabaseService.signOut();
      console.log('🚪 AuthContext.signOut() complete - user logged out');
      return result;
      
    } catch (error) {
      console.log('🚪 AuthContext.signOut() error occurred, forcing logout anyway...');
      // Best effort clear
      setUser(null);
      setSession(null);
      setLoading(false);
      
      return {
        success: false,
        error: 'Failed to sign out. Please try again.'
      };
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      console.log('🔍 AuthContext.refreshUser() starting...');
      const currentUser = await supabaseService.getCurrentUser();
      const currentSession = await supabaseService.getCurrentSession();
      
      console.log('🔍 AuthContext.refreshUser() results:', {
        hasUser: !!currentUser,
        userEmail: currentUser?.email,
        hasSession: !!currentSession
      });
      
      setUser(currentUser);
      setSession(currentSession);
      setLoading(false);
      
      console.log('🔄 Auth state refreshed:', currentUser?.email || 'no user');
    } catch (error) {
      console.log('❌ AuthContext.refreshUser() error:', error);
      setUser(null);
      setSession(null);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};