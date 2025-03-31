export const metadata = {
  metadataBase: new URL('https://amazyyy.amazyyy.com'),
  title: {
    template: '%s | Amazyyy',
    default: 'Amazyyy',
  },
  description: 'Learn Japanese Through Amazyyy articles',
  keywords: ['japanese learning', 'news in japanese', 'japanese reading practice', 'learn japanese', 'japanese study', 'japanese news', 'japanese articles'],
  authors: [{ name: 'Amazyyy' }],
  icons: {
    icon: [
      { url: '/icons/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/amazyyy-app.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/icons/favicon.png',
    apple: [
      { url: '/icons/amazyyy-app.png', sizes: '512x512', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/amazyyy-app.png' }
    ]
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Amazyyy',
    description: 'Learn Japanese Through Amazyyy articles',
    url: 'https://amazyyy.amazyyy.com',
    siteName: 'Amazyyy',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Amazyyy - Learn Japanese Through Amazyyy',
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
    creator: '@teamamazyyy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}; 