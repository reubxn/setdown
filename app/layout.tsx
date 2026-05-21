import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { DatasetProvider } from "@/context/dataset-context";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "setdown",
  description: "drop your Strong export, see your numbers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} antialiased`}>
        <ConvexClientProvider>
          <DatasetProvider>{children}</DatasetProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
