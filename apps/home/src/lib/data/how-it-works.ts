export type Step = {
  number: number;
  title: string;
  description: string;
};

export const steps: Step[] = [
  { number: 1, title: "Connect an integration", description: "Link Postgres, a REST API, or any data source. Credentials are encrypted per environment." },
  { number: 2, title: "Build your API pipeline", description: "Chain steps: query → transform → respond. Run against the live editing environment." },
  { number: 3, title: "Write your React UI", description: "Use the browser IDE or ask Clark to scaffold it. Preview loads real data." },
  { number: 4, title: "Deploy with one click", description: "Gigablocks creates a PR, merges it, and your app goes live. Rollback is a checkout." },
];
