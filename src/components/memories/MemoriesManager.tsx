"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon, XIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMemoryAction,
  deleteMemoryAction,
  updateMemoryAction,
} from "@/lib/actions/memories";
import type { Memory } from "@/lib/memory/memoryRepository";

function AddMemoryForm({ onCancel }: { onCancel: () => void }) {
  const [state, action, pending] = useActionState(createMemoryAction, {});
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !pending && !state?.error) onCancel();
  }, [pending, state, onCancel]);

  return (
    <form action={action} onSubmit={() => { submitted.current = true; }} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
      <div className="space-y-1">
        <Label htmlFor="add-title" className="text-xs text-zinc-400">Title</Label>
        <Input
          id="add-title"
          name="title"
          placeholder="e.g. Preferred language"
          maxLength={100}
          required
          className="bg-zinc-800 border-zinc-700 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="add-content" className="text-xs text-zinc-400">Content</Label>
        <Input
          id="add-content"
          name="content"
          placeholder="e.g. Always answer in TypeScript"
          maxLength={1000}
          required
          className="bg-zinc-800 border-zinc-700 text-sm"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function EditMemoryForm({
  memory,
  onCancel,
}: {
  memory: Memory;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(updateMemoryAction, {});
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !pending && !state?.error) onCancel();
  }, [pending, state, onCancel]);

  return (
    <form action={action} onSubmit={() => { submitted.current = true; }} className="space-y-3">
      <input type="hidden" name="id" value={memory.id} />
      <div className="space-y-1">
        <Label htmlFor={`edit-title-${memory.id}`} className="text-xs text-zinc-400">Title</Label>
        <Input
          id={`edit-title-${memory.id}`}
          name="title"
          defaultValue={memory.title}
          maxLength={100}
          required
          className="bg-zinc-800 border-zinc-700 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`edit-content-${memory.id}`} className="text-xs text-zinc-400">Content</Label>
        <Input
          id={`edit-content-${memory.id}`}
          name="content"
          defaultValue={memory.content}
          maxLength={1000}
          required
          className="bg-zinc-800 border-zinc-700 text-sm"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <XIcon className="size-3.5 mr-1" />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          <CheckIcon className="size-3.5 mr-1" />
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function DeleteMemoryButton({ memory }: { memory: Memory }) {
  const [state, action, pending] = useActionState(deleteMemoryAction, {});
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="id" value={memory.id} />
        <span className="text-xs text-zinc-400">Are you sure?</span>
        {state?.error && (
          <span className="text-xs text-red-400">{state.error}</span>
        )}
        <Button type="submit" variant="ghost" size="sm" disabled={pending} className="text-red-400 hover:text-red-300">
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmed(false)}>
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-zinc-500 hover:text-red-400"
      onClick={() => setConfirmed(true)}
    >
      <TrashIcon className="size-3.5 mr-1" />
      Delete
    </Button>
  );
}

function MemoryRow({ memory }: { memory: Memory }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-lg border border-blue-500/40 bg-zinc-900 p-4">
        <EditMemoryForm memory={memory} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100">{memory.title}</p>
          <p className="mt-0.5 text-sm text-zinc-400">{memory.content}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-zinc-200"
            onClick={() => setEditing(true)}
          >
            <PencilIcon className="size-3.5 mr-1" />
            Edit
          </Button>
          <DeleteMemoryButton memory={memory} />
        </div>
      </div>
    </div>
  );
}

export function MemoriesManager({ memories }: { memories: Memory[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {memories.length === 0 && !adding ? (
        <p className="text-sm text-zinc-500">
          No memories yet. Start chatting and the AI will remember things about you.
        </p>
      ) : (
        memories.map((memory) => (
          <MemoryRow key={memory.id} memory={memory} />
        ))
      )}

      {adding ? (
        <AddMemoryForm onCancel={() => setAdding(false)} />
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-zinc-200"
          onClick={() => setAdding(true)}
        >
          <PlusIcon className="size-4 mr-1" />
          Add memory
        </Button>
      )}
    </div>
  );
}
