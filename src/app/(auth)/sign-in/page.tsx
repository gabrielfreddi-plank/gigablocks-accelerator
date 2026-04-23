"use client";

import Link from "next/link";
import { useActionState, useEffect, type FormEvent } from "react";
import { signIn } from "@/lib/actions/auth";
import { AuthInput } from "@/components/ui/auth-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { posthog } from "@/lib/posthog/client";

export default function SignInPage() {
  const [state, action, pending] = useActionState(signIn, null);

  useEffect(() => {
    if (state?.error) {
      posthog.capture("sign_in_failed", { error: state.error });
    }
  }, [state?.error]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const email = new FormData(e.currentTarget).get("email") as string;
    posthog.capture("sign_in_submitted", { email });
  }

  return (
    <Card className="w-full max-w-sm border-zinc-800 bg-zinc-950 text-white shadow-xl">
      <CardHeader className="space-y-1 pb-4">
        <div className="mb-2 flex justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="28" height="28" rx="6" fill="#3B82F6" />
            <rect x="7" y="7" width="6" height="6" rx="1" fill="white" />
            <rect
              x="15"
              y="7"
              width="6"
              height="6"
              rx="1"
              fill="white"
              fillOpacity="0.6"
            />
            <rect
              x="7"
              y="15"
              width="6"
              height="6"
              rx="1"
              fill="white"
              fillOpacity="0.6"
            />
            <rect x="15" y="15" width="6" height="6" rx="1" fill="white" />
          </svg>
        </div>
        <CardTitle className="text-center text-xl font-semibold">
          Sign in
        </CardTitle>
        <CardDescription className="text-center text-zinc-400">
          Access your Gigablocks account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="sign-in-form"
          action={action}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <AuthInput
            label="Email"
            name="email"
            type="email"
            placeholder="you@company.com"
            required
            autoComplete="email"
          />
          <AuthInput
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {state?.error && (
            <p className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pb-6">
        <p className="text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Create account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
