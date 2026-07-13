import type { Metadata, Viewport } from "next";
import { OddlingProvider } from "@/components/providers/oddling-provider";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://oddling-pwa.vercel.app"),
  title: {
    default: "Oddling 怪可爱分身",
    template: "%s Oddling",
  },
  description: "每天回答一个怪问题 看看另一个你又长成了什么奇怪样子",
  applicationName: "Oddling",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Oddling",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FF6F59" },
    { media: "(prefers-color-scheme: dark)", color: "#191A18" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <OddlingProvider>{children}</OddlingProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
