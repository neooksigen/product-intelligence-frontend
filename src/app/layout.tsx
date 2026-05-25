import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maintelyd",
  description: "Global product price intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children} <Analytics /> 
        {/*25 may 2026: add Linkedin insight tag script. */}      
<Script id="linkedin-insight" strategy="afterInteractive">
  {`
    _linkedin_partner_id = "9374748";
    window._linkedin_data_partner_ids =
      window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(_linkedin_partner_id);
  `}
</Script>

<Script
  src="https://snap.licdn.com/li.lms-analytics/insight.min.js"
  strategy="afterInteractive"
/>
        
      </body>
    </html>
  );
}
