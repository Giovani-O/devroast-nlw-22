import type { Metadata } from "next";
import { IBM_Plex_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { TRPCReactProvider } from "@/trpc/client";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-secondary",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevRoast",
  description: "Roast your code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} ${ibmPlexMono.variable} antialiased bg-bg-page text-text-primary`}
      >
        <TRPCReactProvider>
          <Navbar />
          <main
            className="w-full flex justify-center"
            style={{
              paddingTop: "80px",
              paddingLeft: "40px",
              paddingRight: "40px",
            }}
          >
            <div className="w-full max-w-[960px] flex flex-col items-center">
              {children}
            </div>
          </main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
