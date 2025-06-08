'use client';

import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

export default function SignUp() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="mt-2 text-gray-600">Join Travel Tagger to start planning your adventures</p>
        </div>

        <AuthForm 
          mode="signup"
          switchModeLink={
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          }
        />
      </div>
    </div>
  );
} 