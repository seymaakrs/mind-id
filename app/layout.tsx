import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import { ErrorNotificationProvider } from "@/contexts/ErrorNotificationContext"
import { TaskStreamProvider } from "@/contexts/TaskStreamContext"
import { TaskTrackerWidget } from "@/components/shared/TaskTrackerWidget"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MindID Portal",
  description: "MindID Portal",
  generator: "MindID Portal",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`dark font-sans antialiased`}>
        <AuthProvider>
          <ErrorNotificationProvider>
            <TaskStreamProvider>
              {children}
              <TaskTrackerWidget />
            </TaskStreamProvider>
          </ErrorNotificationProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "dark:bg-background dark:border-border",
          }}
          richColors
          closeButton
        />
        <Analytics />
      </body>
    </html>
  )
}
