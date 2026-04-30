import type { Metadata } from "next";

import "./globals.css";

import { Sidebar } from "@/components/Sidebar";
import { formatDateTime } from "@/lib/formatters";

export const metadata: Metadata = {
  title: "ACME Bottles",
  description: "Supply chain and production processing system for ACME Bottles"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-100 text-slate-900 md:flex">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <header className="border-b border-slate-200 bg-white px-5 py-4 md:px-8">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Supply Chain Management
                  </p>
                  <h1 className="text-2xl font-bold text-slate-950">ACME Bottles</h1>
                </div>
                <p className="text-sm text-slate-500">{formatDateTime(new Date())}</p>
              </div>
            </header>
            <main className="px-5 py-6 md:px-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
