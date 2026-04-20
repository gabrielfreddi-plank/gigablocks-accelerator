export type Step = {
  number: number;
  title: string;
  description: string;
};

export const steps: Step[] = [
  { number: 1, title: "Connect an integration", description: "Link Postgres, REST API ou qualquer fonte. Credenciais criptografadas por ambiente." },
  { number: 2, title: "Build your API pipeline", description: "Chain steps: query → transform → respond. Rode contra o ambiente de edição ao vivo." },
  { number: 3, title: "Write your React UI", description: "Use o IDE do browser ou peça ao Clark para scaffoldar. Preview carrega dados reais." },
  { number: 4, title: "Deploy with one click", description: "Gigablocks cria um PR, faz merge e o app vai ao ar. Rollback é um checkout." },
];
