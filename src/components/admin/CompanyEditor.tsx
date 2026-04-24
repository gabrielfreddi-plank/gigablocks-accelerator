"use client";

import { useState } from "react";
import { updateCompany } from "@/lib/actions/company";

interface CompanyEditorProps {
  companyId: string;
  initialName: string;
}

export function CompanyEditor({
  companyId,
  initialName,
}: CompanyEditorProps) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateCompany(companyId, { name });
      setMessage({ type: "success", text: "Company updated successfully" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-300">Company Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
          placeholder="Enter company name"
        />
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "border border-green-700 bg-green-900/30 text-green-300"
              : "border border-red-700 bg-red-900/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
