import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/providers/AuthProvider'
import { ServiceWorkerProvider } from '@/components/providers/ServiceWorkerProvider'
import { GeofencingProvider } from '@/components/providers/GeofencingProvider'
import { InstallPWABanner } from '@/components/ui/InstallPWABanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ponto Digital - Sistema de Controle de Pontos',
  description: 'Sistema modular de controle de ponto com geolocalização e gestão de recursos humanos',
  applicationName: 'Ponto Digital',
  authors: [{ name: 'Christ Master' }],
  keywords: ['ponto', 'controle', 'rh', 'geolocalização', 'trabalho'],
  creator: 'Christ Master',
  publisher: 'Christ Master',
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ponto Digital',
  },
  openGraph: {
    type: 'website',
    siteName: 'Ponto Digital',
    title: 'Ponto Digital - Sistema de Controle de Pontos',
    description: 'Sistema modular de controle de ponto com geolocalização',
  },
}

export const viewport: Viewport = {
  themeColor: '#f4636e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Meta tags PWA adicionais para iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ponto Digital" />

        {/* Splash screens iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048-2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170-2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1125-2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-750-1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />

        {/* Ícones Apple adicionais */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />

        {/* Prevenir zoom em inputs no iOS */}
        <meta name="format-detection" content="telephone=no" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#f4636e" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ServiceWorkerProvider>
            <GeofencingProvider>
              {children}
              <InstallPWABanner />
            </GeofencingProvider>
          </ServiceWorkerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
