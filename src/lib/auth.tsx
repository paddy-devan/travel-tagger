'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserService } from '@/lib/userService';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFiredInitialEvent = useRef(false);

  const ensureUserInDatabase = async (userId: string, userEmail: string) => {
    const userService = UserService.withClient(supabase);
    const result = await userService.ensureUserExists({ id: userId, email: userEmail });
    if (!result.success) {
      console.error('Failed to ensure user exists in DB:', result.error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // This is the key: only set isLoading to false ONCE.
        // The first event (e.g., INITIAL_SESSION_FETCHED or SIGNED_IN) will turn it off.
        // Subsequent events (like USER_UPDATED or TOKEN_REFRESHED) will not.
        if (!hasFiredInitialEvent.current) {
          setIsLoading(false);
          hasFiredInitialEvent.current = true;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          ensureUserInDatabase(session.user.id, session.user.email || '');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}