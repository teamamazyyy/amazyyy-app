'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaSnowflake, FaUser } from 'react-icons/fa';

export default function SubNavbar() {
  const pathname = usePathname();
  const isLevelsPage = pathname === '/snowboarding/levels';
  const isProfilePage = pathname === '/snowboarding/profile';

  return (
    <div className="sticky top-16 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-12">
            <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              <FaSnowflake className="inline-block w-5 h-5 mr-2" />
              Snowboarding
            </h2>
          </div>
          <div className="flex space-x-12">
            <Link
              href="/snowboarding/levels"
              className={`inline-flex items-center px-2 py-2 border-b-2 text-base font-medium ${
                isLevelsPage
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FaSnowflake className="w-5 h-5 mr-2" />
              Levels
            </Link>
            <Link
              href="/snowboarding/profile"
              className={`inline-flex items-center px-2 py-2 border-b-2 text-base font-medium ${
                isProfilePage
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FaUser className="w-5 h-5 mr-2" />
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 