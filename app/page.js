'use client'

import { Suspense } from 'react';
import Navbar from './components/Navbar';

export default function Home() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Navbar />
      </Suspense>
    </>
  );
} 