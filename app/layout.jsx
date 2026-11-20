import './globals.css';
import AppProvider from '@/components/AppProvider';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import ChatAI from '@/components/ChatAI';

export const metadata = {
  title: 'NutriKos - Menu Hemat & Bergizi untuk Anak Kos',
  description: 'Platform rekomendasi menu bergizi dan hemat berbasis AI untuk mahasiswa perantau.',
  icons: { icon: '/logo.png' },
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#166534' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>
          <div className="min-h-screen w-full bg-surface flex flex-col">
            <Header />
            {/* Desktop layout: Sidebar in normal flex flow, main content takes all remaining width */}
            <div className="flex flex-1 w-full">
              <Sidebar />
              <main className="flex-1 min-w-0 w-full px-4 py-6 sm:px-6 md:px-8 lg:px-8 xl:px-10 pb-28 lg:pb-12">
                {children}
              </main>
            </div>
            {/* Asisten AI Interaktif NutriKos */}
            <ChatAI />
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
