"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCompany(
  companyId: string,
  updates: { name?: string }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify user is owner/admin of company
  const { data: member } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .single();

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    throw new Error("Not authorized");
  }

  const { error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", companyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/company");
}

export async function getCompanyForAdmin(companyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify user is member of company
  const { data: member } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .single();

  if (!member) {
    throw new Error("Not authorized");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  return company;
}
