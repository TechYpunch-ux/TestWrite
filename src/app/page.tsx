"use client";

import { useAuth } from '../lib/hooks/useAuth';
import SignInWithGoogle from "../components/SignInWithGoogle";
import DocumentList from "../components/DocumentList";

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="flex min-h-[calc(100vh-81px)] flex-col items-center justify-center p-8">
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-4xl font-light tracking-tight">Block Writer</h1>
          <p className="text-gray-500 text-lg">Your AI writing companion</p>
        </div>
        <SignInWithGoogle />
      </main>
    );
  }

  return <DocumentList />;
}
