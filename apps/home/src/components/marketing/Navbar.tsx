import { createClient } from "@/lib/supabase/server"
import { NavbarClient } from "./NavbarClient"

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email ?? "User";

  return <NavbarClient user={user ? { displayName } : null} />
}
