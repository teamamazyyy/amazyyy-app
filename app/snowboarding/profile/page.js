'use client';

import Navbar from '@/app/components/Navbar';
import SubNavbar from '../components/SubNavbar';
import SnowboarderProfile from '../components/SnowboarderProfile';

export default function SnowboardingProfilePage() {
  return (
    <>
      <Navbar />
      <SubNavbar />
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <SnowboarderProfile />
      </div>
    </>
  );
} 