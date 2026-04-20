export type Feature = {
  icon: string;
  title: string;
  description: string;
};

export const features: Feature[] = [
  { icon: "⚡", title: "Browser IDE", description: "Monaco editor in the browser — no local setup required." },
  { icon: "🔗", title: "Visual API Builder", description: "Chain steps in a pipeline: SQL → JS → HTTP." },
  { icon: "🤖", title: "Clark AI Agent", description: "AI that writes components and queries and shows a diff." },
  { icon: "🔒", title: "RBAC & Environments", description: "Roles per org and per app, with credential binding." },
  { icon: "📋", title: "Full Audit Log", description: "Filterable logs, CSV export, and SIEM webhook." },
  { icon: "🚀", title: "Git-Native Deploys", description: "Deploy = PR merge; rollback is a git checkout." },
];
