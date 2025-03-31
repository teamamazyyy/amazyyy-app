'use client'

import { Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer'; 

export default function Home() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Navbar />
      </Suspense>
      <Footer />
    </>
  );
} 