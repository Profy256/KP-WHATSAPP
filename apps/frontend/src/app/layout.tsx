import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import ThemeToggle from './ThemeToggle';
import { SITE_URL } from '@/lib/developer';

// Self-hosted by Next.js at build time — no render-blocking request to Google's
// CDN and no layout shift (font metrics are inlined). Replaces the old
// `@import` in globals.css.
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'KP WhatsApp Automation — AI WhatsApp Business Automation',
    template: '%s | KP WhatsApp Automation',
  },
  description:
    'Never miss a customer message again. KP WhatsApp Automation turns WhatsApp conversations into sales with AI auto-replies, a 24/7 AI sales agent, and automated customer support — built by Kafeero Proferious.',
  applicationName: 'KP WhatsApp Automation',
  authors: [{ name: 'Kafeero Proferious' }],
  creator: 'Kafeero Proferious',
  publisher: 'Kafeero Proferious',
  keywords: [
    // Brand & developer
    'KP WhatsApp Automation',
    'Kafeero Proferious',
    'software engineer',
    'full-stack developer',
    // Customer support
    'WhatsApp automation',
    'WhatsApp business automation',
    'WhatsApp auto reply',
    'WhatsApp auto responder',
    'automatic WhatsApp responses',
    'WhatsApp chatbot',
    'WhatsApp customer support',
    'WhatsApp customer service software',
    'WhatsApp support bot',
    'WhatsApp helpdesk',
    // Sales
    'WhatsApp sales automation',
    'WhatsApp sales bot',
    'WhatsApp sales assistant',
    'AI sales agent',
    'AI sales chatbot',
    'WhatsApp lead generation',
    'WhatsApp lead management',
    'WhatsApp CRM',
    // AI
    'AI customer support',
    'AI chatbot for business',
    'AI sales assistant',
    'AI agent for customer service',
    'AI receptionist',
    'AI virtual assistant for business',
    'AI lead qualification',
    'conversational AI for business',
    'AI business assistant',
    // Small business / Africa
    'WhatsApp for small business',
    'WhatsApp business tools',
    'WhatsApp marketing software',
    'WhatsApp business solution',
    'WhatsApp order management',
    'WhatsApp booking system',
    'WhatsApp customer care system',
    // Outcomes
    'increase sales on WhatsApp',
    'capture leads automatically',
    'automate lead follow-up',
    '24/7 customer support',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'KP WhatsApp Automation',
    url: SITE_URL,
    title: 'KP WhatsApp Automation — AI WhatsApp Business Automation',
    description:
      'Turn WhatsApp conversations into sales. AI auto-replies, a 24/7 AI sales agent, and automated customer support for your WhatsApp Business.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

// Runs before paint to set the saved theme and avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <ThemeToggle />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
