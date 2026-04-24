"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AddDocumentState {
  error: string | null;
  success: boolean;
}

export async function checkDocumentExists(
  companyId: string,
  title: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("name", title.trim())
    .maybeSingle();
  return !!data;
}

export async function addDocument(
  _: unknown,
  formData: FormData,
): Promise<AddDocumentState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const name = formData.get("title") as string;
  const originalContent = formData.get("content") as string;
  const companyId = formData.get("companyId") as string;

  if (!name?.trim()) return { error: "Document title is required", success: false };
  if (!originalContent?.trim()) return { error: "Document content is required", success: false };
  if (!companyId) return { error: "Company ID is required", success: false };

  const { error } = await supabase.from("documents").insert({
    name,
    original_content: originalContent,
    company_id: companyId,
  });

  if (error) return { error: error.message, success: false };

  return { error: null, success: true };
}
