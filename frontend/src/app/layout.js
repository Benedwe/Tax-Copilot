import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Tax Copilot — TRA filing, made legible",
  description:
    "Upload your documents, let AI read them, and get a ready-to-file Tanzania tax return in minutes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
