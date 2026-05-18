import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";
import { siteConfig } from "@/lib/config";
import { websiteJsonLd, personJsonLd } from "@/lib/jsonld";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed/rss.xml",
    },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  other: {
    // AI agent discoverability
    "llms-txt": "/llms.txt",
  },
  icons: {
    icon: [
      { url: "/icon-192.webp", sizes: "192x192", type: "image/webp" },
      { url: "/icon-512.webp", sizes: "512x512", type: "image/webp" },
    ],
    apple: "/icon-192.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* PWA theme color — warm gold for dark mode */}
        <meta name="theme-color" content="#1a1614" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.webp" />
        {/* Global JSON-LD for web site and person schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
      </head>
      <body className={`${inter.variable} ${lora.variable} min-h-screen bg-background text-foreground antialiased`}>
        {children}
        <ServiceWorkerRegistrar />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "d70b9eb899084d61a551c912de89c59b"}'
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if(typeof fetch!=="undefined"&&!location.pathname.startsWith("/admin")){var p=location.pathname;var k="v_"+p;var u=!sessionStorage.getItem(k);if(u)sessionStorage.setItem(k,"1");fetch("/api/analytics/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:p,ref:document.referrer,unique:u}),keepalive:true}).catch(function(){})}`,
          }}
        />
      </body>
    </html>
  );
}