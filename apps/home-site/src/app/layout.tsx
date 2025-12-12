import '@/styles/global.css'

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Lidcode - Services Hub',
  description:
    'Lidcode Services Hub - Collection of useful developer tools including ShortLid URL shortener, FileLid file sharing, and more modern web services with clean APIs.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <html lang="en">
        <body className={`${inter.variable} antialiased dark`}>
          {children}
          <Script
            strategy="beforeInteractive"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7052489958602359"
            async
            crossOrigin="anonymous"
          />
          <Script
            strategy="beforeInteractive"
            src="https://www.googletagmanager.com/gtag/js?id=G-KMMJ470WX3"
            async
            crossOrigin="anonymous"
          />
          <Script
            strategy="beforeInteractive"
            id="google-analytics"
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || []
              function gtag() { dataLayer.push(arguments) }
              gtag('js', new Date())
              gtag('config', 'G-KMMJ470WX3');`,
            }}
          />
        </body>
      </html>
    </>
  )
}
