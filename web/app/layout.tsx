import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PromoBanner from '@/components/layout/PromoBanner';

export const metadata: Metadata = {
  title: 'LearnHub — Online courses by expert instructors',
  description:
    'Learn anything from world-class instructors. Build skills with courses, video lectures, quizzes, assignments, and certificates.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <PromoBanner />
          <Header />
          <main className="min-h-[calc(100vh-120px)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
