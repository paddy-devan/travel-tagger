'use client';

import { useState } from 'react';
import AuthForm from '@/components/AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);

  const switchMode = () => {
    setMode(prevMode => (prevMode === 'signin' ? 'signup' : 'signin'));
  };

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm">
            {mode === 'signin' 
              ? 'Sign in to accept the trip invitation' 
              : 'Create an account to accept the trip invitation'
            }
          </p>
        </div>
        
        <AuthForm 
          mode={mode}
          onSuccess={handleSuccess}
          switchModeLink={
            <p className="text-gray-600">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={switchMode}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          }
        />
      </div>
    </div>
  );
} 