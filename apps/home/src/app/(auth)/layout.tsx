import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${inter.variable} font-sans min-h-screen bg-[#0c0c0e] flex items-center justify-center px-4`}
    >
      {children}
    </div>
  );
}
