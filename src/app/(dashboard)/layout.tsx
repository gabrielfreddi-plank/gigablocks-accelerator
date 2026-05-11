import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  const { data: companies } = await supabase
    .from("company_members")
    .select("companies(id)")
    .eq("user_id", user.id)
    .limit(1);

  const companyId = companies?.[0]?.companies?.id ?? null;
  const researchHref = companyId ? `/research/${companyId}` : "/dashboard";

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
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/dashboard"
                className="text-zinc-400 hover:text-zinc-200"
              >
                Home
              </Link>
              <Link href="/chat" className="text-zinc-400 hover:text-zinc-200">
                Chat
              </Link>
              <Link
                href="/canvas"
                className="text-zinc-400 hover:text-zinc-200"
              >
                Canvas
              </Link>
              <Link
                href={researchHref}
                className="text-zinc-400 hover:text-zinc-200"
              >
                Research
              </Link>
            </div>
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
