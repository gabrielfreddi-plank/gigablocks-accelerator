import { getMemoriesAction } from "@/lib/actions/memories";
import { MemoriesManager } from "@/components/memories/MemoriesManager";

export default async function MemoriesPage() {
  const memories = await getMemoriesAction();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Memories</h1>
        <p className="mt-2 text-zinc-400">
          Things the AI remembers about you. Edit or delete any memory, or add new ones.
        </p>
      </div>

      <MemoriesManager memories={memories} />
    </main>
  );
}
