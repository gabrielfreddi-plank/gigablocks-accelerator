"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, posthog } from "@/lib/posthog/client";

// Dispara pageview a cada mudança de rota
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const url =
      searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
    posthog.capture("$pageview", { $current_url: window.location.origin + url });
  }, [pathname, searchParams]);

  return null;
}

interface PostHogProviderProps {
  children: React.ReactNode;
  // Passe o userId e email do usuário logado para identificá-lo no PostHog
  userId?: string;
  userEmail?: string;
}

export function PostHogProvider({
  children,
  userId,
  userEmail,
}: PostHogProviderProps) {
  const identified = useRef(false);

  useEffect(() => {
    initPostHog();
  }, []);

  // Identifica o usuário assim que tiver sessão
  useEffect(() => {
    if (!userId || identified.current) return;
    posthog.identify(userId, { email: userEmail });
    identified.current = true;
  }, [userId, userEmail]);

  // Reseta a identidade ao deslogar
  useEffect(() => {
    if (userId) return;
    if (identified.current) {
      posthog.reset();
      identified.current = false;
    }
  }, [userId]);

  return (
    <>
      <PostHogPageView />
      {children}
    </>
  );
}
