import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CompanyDocumentsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data } = await supabase
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .single();

  if (!data) redirect("/dashboard");

  return <>{children}</>;
}
