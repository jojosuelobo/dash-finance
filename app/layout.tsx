import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { AuthProvider } from "@/contexts/AuthContext";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Dash Finance",
  description: "Monitoramento de despesas",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-50 dark:bg-zinc-950">
        <AuthProvider>
          <Header />
          <main className="mx-auto max-w-4xl px-4 py-4 sm:py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
