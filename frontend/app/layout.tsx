import type { Metadata } from 'next';
// Self-hosted Cairo (bundled by Next from node_modules, no CDN)
import '@fontsource/cairo/arabic-400.css';
import '@fontsource/cairo/arabic-600.css';
import '@fontsource/cairo/arabic-700.css';
import '@fontsource/cairo/arabic-800.css';
import '@fontsource/cairo/latin-400.css';
import '@fontsource/cairo/latin-600.css';
import '@fontsource/cairo/latin-700.css';
import '@fontsource/cairo/latin-800.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'منظومة دريم بارك المركزية للعمليات والتحليلات — Dream Park & Zoo',
  description: 'Enterprise Operations & Financial Analytics Platform for Dream Park Theme Park',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-400 dark">
        {children}
      </body>
    </html>
  );
}
