"use client";

import { useAuth } from '../lib/hooks/useAuth';

export default function SignInWithGoogle() {
  const { signInWithGoogle } = useAuth();

  return (
    <button
      onClick={signInWithGoogle}
      className="flex items-center justify-center bg-white text-gray-700 font-light py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 ease-in-out"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5 mr-3" />
      Sign in with Google
    </button>
  );
}
