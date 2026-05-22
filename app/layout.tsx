import type { Metadata } from "next";
import { Geist, Bebas_Neue } from "next/font/google";
import { DatasetProvider } from "@/context/dataset-context";
import { AuthProvider } from "@/context/auth-context";
import { PreferencesProvider } from "@/context/preferences-context";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
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
      <body className={`${geist.variable} ${bebas.variable} antialiased`}>
        <AuthProvider>
          <PreferencesProvider>
            <DatasetProvider>{children}</DatasetProvider>
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
