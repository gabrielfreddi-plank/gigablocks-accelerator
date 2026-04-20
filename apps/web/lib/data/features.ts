export type Feature = {
  icon: string;
  title: string;
  description: string;
};

export const features: Feature[] = [
  { icon: "⚡", title: "Browser IDE", description: "Editor Monaco no navegador, sem setup local." },
  { icon: "🔗", title: "Visual API Builder", description: "Pipeline de steps: SQL → JS → HTTP." },
  { icon: "🤖", title: "Clark AI Agent", description: "IA que escreve componente + query e mostra diff." },
  { icon: "🔒", title: "RBAC & Environments", description: "Roles por org e por app, bind de credenciais." },
  { icon: "📋", title: "Full Audit Log", description: "Logs filtráveis, export CSV, webhook SIEM." },
  { icon: "🚀", title: "Git-Native Deploys", description: "Deploy = PR merge, rollback via Git." },
];
