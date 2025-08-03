import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Boardroom - Your Personal Expert Advisory Board',
  description: 'Access your personal board of AI experts anytime. Get strategic advice, solve complex problems, and make better decisions with continuous conversations and saved insights.',
  keywords: 'AI boardroom, expert advisors, strategic consulting, business intelligence, decision making',
  authors: [{ name: 'AI Boardroom Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'AI Boardroom - Your Personal Expert Advisory Board',
    description: 'Access your personal board of AI experts anytime. Get strategic advice, solve complex problems, and make better decisions.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Boardroom - Your Personal Expert Advisory Board',
    description: 'Access your personal board of AI experts anytime.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-black text-white overflow-x-hidden`}>
        {children}
      </body>
    </html>
  )
} 