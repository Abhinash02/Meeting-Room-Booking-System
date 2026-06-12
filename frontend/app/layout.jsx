import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'RoomIt — Meeting Room Booking',
  description: 'Book meeting rooms with real-time availability and conflict-safe reservations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen font-sans antialiased bg-gradient-to-br from-indigo-50 via-slate-50 to-cyan-50 text-slate-900 selection:bg-indigo-500/30" suppressHydrationWarning>
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#f8fafc' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
          }}
        />
      </body>
    </html>
  );
}
