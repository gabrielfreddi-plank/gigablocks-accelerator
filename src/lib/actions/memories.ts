"use server";

import { revalidatePath } from "next/cache";

import {
  MemoryTitleConflictError,
  MemoryNotFoundError,
  createMemory,
  deleteMemory,
  fetchMemoriesByUser,
  updateMemory,
  type Memory,
} from "@/lib/memory/memoryRepository";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function getMemoriesAction(): Promise<Memory[]> {
  const userId = await getAuthenticatedUserId();
  return fetchMemoriesByUser(userId);
}

export async function createMemoryAction(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  if (!title || !content) return { error: "Title and content are required." };

  try {
    const userId = await getAuthenticatedUserId();
    await createMemory(userId, title, content);
    revalidatePath("/settings/memories");
    return {};
  } catch (error) {
    if (error instanceof MemoryTitleConflictError) {
      return { error: "You already have a memory with this title." };
    }
    return { error: "Failed to create memory." };
  }
}

export async function updateMemoryAction(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  if (!id || !title || !content) return { error: "All fields are required." };

  try {
    const userId = await getAuthenticatedUserId();
    await updateMemory(userId, id, title, content);
    revalidatePath("/settings/memories");
    return {};
  } catch (error) {
    if (error instanceof MemoryTitleConflictError) {
      return { error: "You already have a memory with this title." };
    }
    if (error instanceof MemoryNotFoundError) {
      return { error: "Memory not found." };
    }
    return { error: "Failed to update memory." };
  }
}

export async function deleteMemoryAction(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const id = formData.get("id") as string;
  if (!id) return { error: "Memory ID is required." };

  try {
    const userId = await getAuthenticatedUserId();
    await deleteMemory(userId, id);
    revalidatePath("/settings/memories");
    return {};
  } catch (error) {
    if (error instanceof MemoryNotFoundError) {
      return { error: "Memory not found." };
    }
    return { error: "Failed to delete memory." };
  }
}
