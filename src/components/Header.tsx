"use client";

import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';
import { useState } from 'react';
import AIStyleManager from './AIStyleManager';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { user, signOut } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState('');
  const pathname = usePathname();
  const isDocumentPage = pathname?.startsWith('/document/');

  return (
    <header className="w-full py-4 border-b border-gray-100">
      <div className="max-w-3xl mx-auto flex justify-between items-center px-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-800 rounded"></div>
          <Link href="/" className="text-base font-medium">
            Block Writer
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <>
              {isDocumentPage && (
                <AIStyleManager onStyleSelected={setSelectedStyle} />
              )}
              {isDocumentPage && selectedStyle && (
                <span className="text-sm text-gray-600">
                  Active Style: {selectedStyle}
                </span>
              )}
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 