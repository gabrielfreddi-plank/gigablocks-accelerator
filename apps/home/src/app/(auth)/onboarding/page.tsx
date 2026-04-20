"use client";

import { useActionState } from "react";
import { createEmpresa } from "@/lib/actions/auth";
import { AuthInput } from "@/components/ui/auth-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(createEmpresa, null);

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
            <rect x="15" y="7" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="7" y="15" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="15" y="15" width="6" height="6" rx="1" fill="white" />
          </svg>
        </div>
        <CardTitle className="text-center text-xl font-semibold">Sua empresa</CardTitle>
        <CardDescription className="text-center text-zinc-400">
          Passo 2 de 2 — Crie sua organização
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        <form action={action} className="flex flex-col gap-4">
          <AuthInput
            label="Nome da empresa"
            name="nome"
            type="text"
            placeholder="Acme Inc."
            required
            autoComplete="organization"
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
            {pending ? "Criando..." : "Criar empresa e entrar"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
