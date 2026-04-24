import { createClient } from "@/lib/supabase/server";

interface CompanyOverviewProps {
  companyId: string;
}

interface User {
  name: string | null;
}

interface Member {
  user_id: string;
  role: string;
  users: User;
}

export async function CompanyOverview({ companyId }: CompanyOverviewProps) {
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  const { count: userCount } = await supabase
    .from("company_members")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const { data: membersData } = await supabase
    .from("company_members")
    .select("*, users(name)")
    .eq("company_id", companyId);

  const members = membersData as Member[] | null;


  if (!company) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <p className="text-zinc-400">Company not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-zinc-400">Company Name</p>
            <p className="mt-1 text-2xl font-semibold">{company.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-400">Company ID</p>
              <p className="mt-1 text-sm font-mono text-zinc-300">
                {company.id}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Created</p>
              <p className="mt-1 text-sm text-zinc-300">
                {new Date(company.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <a
            href="/company"
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-medium transition"
          >
            Edit Company
          </a>
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-sm text-zinc-400">Active Members</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {userCount || 0}
          </p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-sm text-zinc-400">Admins</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {members?.filter((m) => m.role === "admin" || m.role === "owner").length || 0}
          </p>
        </article>
      </div>

      {members && members.length > 0 && (
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="mb-4 text-sm font-semibold text-zinc-200">Members</p>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between border-b border-zinc-800/50 pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm text-zinc-200">
                    {member.users?.name || "Unnamed"}
                  </p>
                  <p className="text-xs text-zinc-500">{member.user_id}</p>
                </div>
                <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}
