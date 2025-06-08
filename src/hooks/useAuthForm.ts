import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getRedirectUrl } from '@/lib/utils';

type AuthMode = 'signin' | 'signup';

interface UseAuthFormOptions {
  mode: AuthMode;
  onSuccess?: () => void;
  redirectUrl?: string;
}

/**
 * Encapsulates the logic for user authentication forms (sign in/sign up).
 * Manages state, validation, and submission for email/password and OAuth.
 */
export function useAuthForm({ mode, onSuccess, redirectUrl = '/dashboard' }: UseAuthFormOptions) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess ? onSuccess() : router.push(redirectUrl);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectUrl(redirectUrl),
          },
        });
        if (error) throw error;
        onSuccess ? onSuccess() : router.push('/signup/confirmation');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || `${mode === 'signin' ? 'Sign in' : 'Sign up'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(redirectUrl),
        },
      });
      if (error) throw error;
      // No need to handle success here, as the page will redirect
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'Google authentication failed');
      setLoading(false); // Only called if an error occurs before redirect
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    handleEmailAuth,
    handleGoogleAuth,
  };
} 