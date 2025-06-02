'use client';

import React from 'react';
import Image from 'next/image';

// Define a basic User type structure if not imported globally
// Adjust based on your actual user object from useAuth
interface User {
  id: string;
  email?: string;
  // Add other relevant user properties if needed
}

interface HeaderProps {
  user: User | null;
  onSignOut: () => void;
}

export default function Header({ user, onSignOut }: HeaderProps) {
  return (
    <header className="absolute top-4 left-4 right-4 h-14 bg-white shadow-md z-10 flex items-center px-4 rounded-lg border border-gray-200">
      <div className="flex-1 flex items-center space-x-4">
        {/* Logo */}
        <div className="flex items-center">
            <Image
              src="/images/Logo.svg"
              alt="Travel Tagger"
              width={60}
              height={20}
              className="h-8 w-auto"
              priority
            />
        </div>
      </div>
      
      {/* User info and sign out on the right */}
      <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden md:inline">{user?.email || 'User'}</span>
           <button
             onClick={onSignOut}
             className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
             aria-label="Sign out"
           >
             Sign Out
           </button>
         </div>
    </header>
  );
} 