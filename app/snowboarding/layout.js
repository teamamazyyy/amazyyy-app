import Navbar from '@/app/components/Navbar';
import SubNavbar from './components/SubNavbar';

export default function SnowboardingLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="pt-16">
        {children}
      </div>
    </>
  );
} 