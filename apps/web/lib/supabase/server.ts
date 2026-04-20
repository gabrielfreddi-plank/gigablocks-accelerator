import { createClient as createSupabaseClient } from "@repo/db/server"

export async function createClient() {
  return createSupabaseClient()
}
