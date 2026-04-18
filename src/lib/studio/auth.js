import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ALLOWED_EMAILS = ['arav@suhasmusic.com', 'management@suhasmusic.com'];

export function useStudioAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (ALLOWED_EMAILS.includes(session.user.email)) {
          setUser(session.user);
        } else {
          setUnauthorized(true);
          supabase.auth.signOut();
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (ALLOWED_EMAILS.includes(session.user.email)) {
          setUser(session.user);
          setUnauthorized(false);
        } else {
          setUnauthorized(true);
          supabase.auth.signOut();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email) => {
    if (!ALLOWED_EMAILS.includes(email.trim().toLowerCase())) {
      throw new Error('This email is not authorized for Studio access.');
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/studio` },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, unauthorized, login, logout };
}
