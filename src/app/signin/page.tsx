'use client';

import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

export default function SignIn() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="mt-2 text-gray-600">Welcome back to Travel Tagger</p>
        </div>

        <AuthForm 
          mode="signin"
          switchModeLink={
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          }
        />
      </div>
    </div>
  );
} 