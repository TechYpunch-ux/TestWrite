import { Metadata } from 'next';
import "./globals.css";
import { AuthProvider } from "../lib/contexts/AuthContext";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: 'Document App',
  description: 'A simple document editor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
