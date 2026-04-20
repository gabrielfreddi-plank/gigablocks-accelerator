import { createClient as createSupabaseClient } from "@repo/db/client"

export function createClient() {
  return createSupabaseClient()
}
