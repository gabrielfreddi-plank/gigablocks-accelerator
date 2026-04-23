import { PostHog } from "posthog-node";

// Singleton para reutilizar em Server Components e Server Actions
let _client: PostHog | null = null;

export function getPostHogServer(): PostHog {
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1, // envia imediatamente (importante em serverless)
      flushInterval: 0,
    });
  }
  return _client;
}
