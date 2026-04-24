import { createClient } from "@/lib/supabase/server";
import { CompanyEditor } from "@/components/admin/CompanyEditor";

export default async function CompanyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Get user's primary company
  const { data: companies } = await supabase
    .from("company_members")
    .select("company_id, companies(id, name)")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1);

  const company = companies?.[0]?.companies;

  if (!company) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Company Settings
          </h1>
          <p className="mt-2 text-zinc-400">No company found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-4">
        <a
          href="/dashboard"
          className="text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          aria-label="Back to dashboard"
        >
          ← Back
        </a>
      </div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Company Settings
        </h1>
        <p className="mt-1 text-zinc-400">Edit your company information</p>
      </div>

      <div className="max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <CompanyEditor
          companyId={company.id}
          initialName={company.name}
        />
      </div>
    </main>
  );
}
