import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type Memory = Database["public"]["Tables"]["memories"]["Row"];

export class MemoryTitleConflictError extends Error {
  constructor() {
    super("A memory with this title already exists.");
    this.name = "MemoryTitleConflictError";
  }
}

export class MemoryNotFoundError extends Error {
  constructor() {
    super("Memory not found.");
    this.name = "MemoryNotFoundError";
  }
}

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

export async function fetchMemoriesByUser(userId: string): Promise<Memory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMemory(
  userId: string,
  title: string,
  content: string,
): Promise<Memory> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memories")
    .insert({ user_id: userId, title, content })
    .select()
    .single();

  if (error) {
    if (isUniqueViolation(error)) throw new MemoryTitleConflictError();
    throw new Error(error.message);
  }

  return data;
}

export async function updateMemory(
  userId: string,
  id: string,
  title: string,
  content: string,
): Promise<Memory> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memories")
    .update({ title, content })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    if (isUniqueViolation(error)) throw new MemoryTitleConflictError();
    // PGRST116 = no rows returned by .single()
    if (error.code === "PGRST116") throw new MemoryNotFoundError();
    throw new Error(error.message);
  }

  if (!data) throw new MemoryNotFoundError();
  return data;
}

export async function deleteMemory(
  userId: string,
  id: string,
): Promise<void> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("memories")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  if (count === 0) throw new MemoryNotFoundError();
}
