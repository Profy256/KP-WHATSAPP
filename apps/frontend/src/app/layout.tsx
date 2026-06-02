import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import ThemeToggle from './ThemeToggle';

export const metadata: Metadata = {
  title: 'KP WhatsApp Automation',
  description: 'AI-powered WhatsApp business automation platform.',
};

// Runs before paint to set the saved theme and avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
