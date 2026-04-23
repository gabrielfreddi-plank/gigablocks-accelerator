import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">You are logged in.</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Welcome to your dashboard
          </h1>
          <p className="mt-3 text-zinc-400">
            Signed in as{" "}
            <span className="font-medium text-zinc-200">{user?.email}</span>
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            Sign out
          </button>
        </form>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Users", value: "12,480" },
          { label: "Projects", value: "842" },
          { label: "Deployments", value: "3,201" },
          { label: "Errors (24h)", value: "0" },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <p className="text-sm text-zinc-400">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {item.value}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
