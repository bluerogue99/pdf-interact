import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Provider";
import { Toaster } from 'react-hot-toast';
import { ClerkProvider,} from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatPDF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <ClerkProvider>
          <Providers>
            <Toaster />
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
