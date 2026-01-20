import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SupportFloatButton } from "@/components/support-float-button";
import { KnowledgeBaseSidebar } from "@/components/knowledge-base-sidebar";
import { FloatingReportsButton } from "@/components/floating-reports-button";
import { LandingWhatsAppChat } from "@/components/landing-whatsapp-chat";
import { CookieConsent } from "@/components/cookie-consent";
import { TrialBannerWrapper } from "@/components/trial-banner-wrapper";
import { MetaPixelProvider, MetaPixelNoscript } from "@/components/meta-pixel-provider";
import { GTMProvider, GTMNoscript } from "@/components/gtm-provider";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Leads Pro - Sistema de Propostas Comerciais",
  description: "Gerencie e envie propostas comerciais de alto nível com o DL Pro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
        suppressHydrationWarning
      >
        <GTMNoscript />
        <MetaPixelNoscript />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <GTMProvider>
              <MetaPixelProvider>
                {children}
              </MetaPixelProvider>
            </GTMProvider>
          </Suspense>
          <SupportFloatButton />
          <FloatingReportsButton />
          <KnowledgeBaseSidebar />
          <LandingWhatsAppChat />
          <CookieConsent />
          <TrialBannerWrapper />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
