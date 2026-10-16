import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard | Super Double T General Trading PLC",
  description: "Employee attendance management dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
