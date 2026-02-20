"use client";

import type React from "react";
import { useEffect } from "react";

export default function FormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Override global overflow:hidden + overscroll-behavior on html/body
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.style.setProperty("overflow", "auto", "important");
    html.style.setProperty("height", "auto", "important");
    html.style.setProperty("overscroll-behavior", "auto", "important");
    body.style.setProperty("overflow", "auto", "important");
    body.style.setProperty("height", "auto", "important");
    body.style.setProperty("overscroll-behavior", "auto", "important");

    return () => {
      html.style.removeProperty("overflow");
      html.style.removeProperty("height");
      html.style.removeProperty("overscroll-behavior");
      body.style.removeProperty("overflow");
      body.style.removeProperty("height");
      body.style.removeProperty("overscroll-behavior");
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">MindID</h1>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        MindID &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
