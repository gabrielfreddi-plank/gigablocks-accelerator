import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is admin (owner/admin of a company)
  const { data: memberData } = await supabase
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1);

  const isAdmin = memberData && memberData.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Gigablocks
              </p>
              <p className="text-sm text-zinc-300">Dashboard</p>
            </div>
            {isAdmin && (
              <div className="flex gap-4 text-sm">
                <a
                  href="/dashboard"
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  Overview
                </a>
                <a
                  href="/company"
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  Company
                </a>
              </div>
            )}
          </nav>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-200"
            >
              Sign out
            </Button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
