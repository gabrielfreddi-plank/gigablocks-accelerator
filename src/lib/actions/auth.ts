"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostHogServer } from "@/lib/posthog/server";

export async function signIn(_: unknown, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: formData.get("password") as string,
  });

  if (error) {
    const posthog = getPostHogServer();
    posthog.capture({
      distinctId: email,
      event: "sign_in_error",
      properties: { error: error.message },
    });
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(_: unknown, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome: name },
    },
  });

  if (error) {
    const posthog = getPostHogServer();
    posthog.capture({
      distinctId: email,
      event: "sign_up_error",
      properties: { error: error.message },
    });
    return { error: error.message };
  }

  const posthog = getPostHogServer();
  const userId = data.user?.id ?? email;
  posthog.identify({ distinctId: userId, properties: { email, name } });
  posthog.capture({
    distinctId: userId,
    event: "user_signed_up",
    properties: { email, name },
  });

  redirect("/onboarding");
}

export async function createEmpresa(_: unknown, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const companyName = formData.get("name") as string;

  const { error } = await supabase.from("empresas").insert({
    nome: companyName,
    usuario_id: user.id,
  });

  if (error) {
    const posthog = getPostHogServer();
    posthog.capture({
      distinctId: user.id,
      event: "company_creation_failed",
      properties: { error: error.message },
    });
    return { error: error.message };
  }

  const posthog = getPostHogServer();
  posthog.capture({
    distinctId: user.id,
    event: "company_created",
    properties: { company_name: companyName },
  });

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
