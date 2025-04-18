import { Analytics } from "@vercel/analytics/react"

import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FirebaseProvider from "@/components/firebase/FirebaseProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NYC Chess Club",
  description: "Information hub for NYC chess clubs and tournaments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FirebaseProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </FirebaseProvider>
        <Analytics />
      </body>
    </html>
  );
}