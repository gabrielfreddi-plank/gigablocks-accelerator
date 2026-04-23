import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { PostHogProvider } from "@/components/providers/posthog-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Gigablocks",
  description: "The fastest way to build and ship blockchain applications.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        {/* Suspense necessário por causa do useSearchParams dentro do PostHogProvider */}
        <Suspense>
          <PostHogProvider
            userId={user?.id}
            userEmail={user?.email}
          >
            {children}
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
