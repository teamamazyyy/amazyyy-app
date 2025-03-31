'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaGoogle, FaCheck, FaNewspaper, FaLanguage, FaHeart, FaSync, FaMoon } from 'react-icons/fa';
import { useAuth } from '@/lib/AuthContext';
import Image from 'next/image';

export default function JoinPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const [expandedBenefit, setExpandedBenefit] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const themeParam = params.get('theme');
      if (themeParam === 'dark' || themeParam === 'light') {
        setTheme(themeParam);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(themeParam);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    
    // Update URL parameter without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('theme', newTheme);
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Right Side - Fixed Sign In */}
      <div className="w-full fixed lg:sticky lg:top-0 bottom-0 left-0 right-0 bg-gradient-to-br from-white via-white to-gray-50/90 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/90 flex flex-col justify-center items-center lg:p-12 p-6 pb-[calc(2rem+env(safe-area-inset-bottom,24px))] lg:pb-12 lg:border-l border-t lg:border-t-0 border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] lg:shadow-none">
        <div className="w-full max-w-sm flex flex-col min-h-[120px] lg:min-h-fit">
          <div className="flex-1">
            <div className="flex flex-col lg:flex-col items-center text-center">
              <div className="flex-1 mb-4 lg:mb-8">
                <h2 className="text-2xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 tracking-tight">
                  Amazyyy
                </h2>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1 lg:mt-2">
                  Join the Amazyyy universe, explore the world with us.
                </p>
                <p className="text-sm font-medium text-green-600 dark:text-green-500 mt-1 hidden lg:block">
                  Tons of tools to help you learn and explore the world.
                </p>
              </div>
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center px-6 py-3 lg:py-4 border border-transparent 
                  text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                  transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <FaGoogle className="w-5 h-5 mr-2 lg:mr-3" />
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Continue with </span>
                <span className='pl-1'>Google</span>
              </button>
            </div>
          </div>
          <p className="text-[9px] lg:text-sm text-center text-gray-500/70 dark:text-gray-400/70 mt-auto pt-4 leading-tight">
            By signing up, you agree to the Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
} 