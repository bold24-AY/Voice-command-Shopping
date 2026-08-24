import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartCart Plus AI - Voice Command Shopping Assistant',
  description: 'A voice-first intelligent shopping list manager powered by Google Gemini AI, Web Speech API, and Supabase.',
  keywords: ['voice shopping', 'smart shopping list', 'gemini ai', 'voice assistant', 'flipkart design'],
  authors: [{ name: 'Software Engineering Candidate' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#f1f3f6] text-gray-900 antialiased selection:bg-[#ffe500] selection:text-[#2874f0]">
        {children}
      </body>
    </html>
  );
}
