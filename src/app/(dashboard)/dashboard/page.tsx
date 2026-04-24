import { createClient } from "@/lib/supabase/server";
import { CompanyOverview } from "@/components/admin/CompanyOverview";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Get user's companies (where they are owner/admin)
  const { data: companies } = await supabase
    .from("company_members")
    .select("company_id, role, companies(id, name)")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"]);

  const company = companies?.[0]?.companies;

  if (!company) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-zinc-400">
            No companies found. Create one to get started.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-400">Company overview and management</p>
      </div>

      <CompanyOverview companyId={company.id} />
    </main>
  );
}
