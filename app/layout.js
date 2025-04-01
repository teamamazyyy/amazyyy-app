import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import Script from 'next/script';
import Footer from './components/Footer';
import { getCurrentTheme } from '@/lib/utils/theme';

export const metadata = {
  title: 'Amazyyy',
  description: 'Learn Japanese Through Amazyyy articles',
  openGraph: {
    title: 'Amazyyy',
    description: 'Learn Japanese Through Amazyyy articles',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Amazyyy - Learn Japanese Through Amazyyy articles',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amazyyy',
    description: 'Learn Japanese Through Amazyyy articles',
    images: ['/images/og-image.png'],
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-YWB00W1EMG"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-YWB00W1EMG');
              `}
            </Script>
          </>
        )}
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="72fee403-5be8-4238-80c4-c099815f73d8"
          data-domains="amazyyy.vercel.app"
          strategy="afterInteractive"
        />
      </head>
      <body suppressHydrationWarning className="flex flex-col min-h-screen bg-gray-50 dark:bg-[rgb(19,31,36)] transition-colors duration-300">
        <AuthProvider>
          <main className="flex-grow">
            {children}
          </main>
          {/* <Footer forceTheme="light" /> */}
        </AuthProvider>
      </body>
    </html>
  );
} 