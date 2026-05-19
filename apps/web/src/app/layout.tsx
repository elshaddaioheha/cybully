import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cybully Safety",
  description: "MVP cyberbullying detection and moderation console"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

