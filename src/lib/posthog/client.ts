import posthog from "posthog-js";

// Inicializa o PostHog apenas no browser (não no servidor)
export function initPostHog() {
  if (typeof window === "undefined") return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/ingest", // proxy reverso para evitar ad-blockers
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_pageview: false, // controlamos manualmente via PostHogPageView
    capture_pageleave: true,
    capture_exceptions: true,
    person_profiles: "identified_only", // só cria perfil para usuários identificados (bom para o free)
    debug: process.env.NODE_ENV === "development",
  });
}

export { posthog };
