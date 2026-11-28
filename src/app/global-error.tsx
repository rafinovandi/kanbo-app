"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from "react";

import ServerError from "./_components/server-error";

import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Replaces the root layout when it fails, so it brings its own document, styles and fonts (light theme).
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" data-palette="ocean" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <title>Something Went Wrong | Kanbo</title>
        <ServerError error={error} retry={retry} />
      </body>
    </html>
  );
}
