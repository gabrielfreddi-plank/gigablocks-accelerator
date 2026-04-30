import { CanvasInterface } from "@/components/canvas/CanvasInterface";

export default function CanvasPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Canvas</h1>
        <p className="mt-1 text-zinc-400">
          Create beautiful interfaces with AI.
        </p>
      </div>

      <CanvasInterface />
    </main>
  );
}
