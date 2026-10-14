import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('student'); // 'student' | 'mentor'

  // Initialize session on mount & subscribe to Supabase Auth state changes
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { session: initialSession, user: initialUser, profile: initialProfile } =
          await authService.getCurrentSession();

        if (isMounted) {
          if (initialSession && initialUser) {
            setSession(initialSession);
            setUser(initialUser);
            setProfile(initialProfile);
            if (initialProfile?.account_type) {
              setUserRole(initialProfile.account_type);
            }
          }
        }
      } catch (err) {
        console.error('[AuthContext] Init error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to real-time auth changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);

        // Fetch refreshed profile
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newSession.user.id)
          .maybeSingle();

        if (isMounted) {
          setProfile(userProfile);
          if (userProfile?.account_type) {
            setUserRole(userProfile.account_type);
          }
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    setLoading(true);
    const { user: authedUser, session: newSession, profile: userProfile, error } =
      await authService.signIn({ email, password });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    setUser(authedUser);
    setSession(newSession);
    setProfile(userProfile);
    if (userProfile?.account_type) {
      setUserRole(userProfile.account_type);
    }
    setLoading(false);
    return { success: true, role: userProfile?.account_type || 'student' };
  };

  const signUp = async (payload) => {
    setLoading(true);
    const { user: newUser, session: newSession, profile: newProfile, error } =
      await authService.signUp(payload);

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    setUser(newUser);
    setSession(newSession);
    setProfile(newProfile);
    if (newProfile?.account_type) {
      setUserRole(newProfile.account_type);
    }
    setLoading(false);
    return {
      success: true,
      role: newProfile?.account_type || payload.role || 'student',
      needsEmailConfirmation: !newSession && !newUser?.confirmed_at,
    };
  };

  const signOut = async () => {
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { data: refreshed } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (refreshed) {
      setProfile(refreshed);
      if (refreshed.account_type) {
        setUserRole(refreshed.account_type);
      }
    }
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      loading,
      userRole,
      setUserRole,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      isAuthenticated: !!user,
    }),
    [user, profile, session, loading, userRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
