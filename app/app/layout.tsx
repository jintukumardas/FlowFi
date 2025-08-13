import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlowFi - Consumer Payment Infrastructure',
  description: 'FlowFi enables smart recurring payments, social split bills, and automatic rewards on Morph L2',
  keywords: ['payfi', 'morph', 'payments', 'defi', 'consumer', 'rewards'],
  authors: [{ name: 'FlowFi Team' }],
  openGraph: {
    title: 'FlowFi - Consumer Payment Infrastructure',
    description: 'Smart payments with rewards and social features on Morph L2',
    type: 'website',
    locale: 'en_US',
    siteName: 'FlowFi',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowFi - Consumer Payment Infrastructure',
    description: 'Smart payments with rewards and social features on Morph L2',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}