"use client";

import { useActionState, useEffect, useState, useTransition, useRef } from "react";
import { useParams } from "next/navigation";
import { extractPolicies, type Policy } from "@/lib/actions/extractPolicies";
import { addDocument, checkDocumentExists } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Client-side path validator — mirrors the server-side rules in
 * `src/lib/actions/documents.ts` (CONTEXT.md D-12).
 *
 * Returns the UI-SPEC error string (verbatim) on the first failing rule,
 * or null when the path is acceptable. The server runs the same checks
 * regardless of what the client returns — this is UX only.
 */
function validatePathClient(path: string): string | null {
  if (!path) return "Document path is required";
  if (!path.startsWith("/")) return 'Path must start with "/"';
  const segments = path.split("/");
  if (segments.some((segment) => segment === "..")) {
    return 'Path cannot contain ".." segments';
  }
  if (!/^[A-Za-z0-9._\-/]+$/.test(path)) {
    return 'Path can only contain letters, numbers, "-", "_", ".", and "/"';
  }
  if (path.length > 256 || segments.filter(Boolean).length > 8) {
    return "Path is too long (max 256 characters, 8 segments)";
  }
  return null;
}

function PolicyCard({ policy }: { policy: Policy }) {
  return (
    <div className="rounded-[10px] border border-zinc-700 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-600">
      <h3 className="text-zinc-100 font-semibold text-sm mb-1">
        {policy.title}
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed mb-3">
        {policy.summary}
      </p>
      {policy.requirements.length > 0 && (
        <ul className="space-y-1.5">
          {policy.requirements.map((req, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              {req}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AddDocumentPage() {
  const { companyId } = useParams<{ companyId: string }>();

  const [extractState, extractDispatch, extractPending] = useActionState(
    extractPolicies,
    { policies: null, error: null },
  );
  const [submitState, submitAction, submitPending] = useActionState(
    addDocument,
    { error: null, success: false },
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [path, setPath] = useState("");
  const [pathError, setPathError] = useState<string | null>(null);
  const [extractPoliciesToggle, setExtractPoliciesToggle] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checking, startChecking] = useTransition();
  const [showIndexedFlash, setShowIndexedFlash] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // UI-SPEC submit-button label cycle:
  //   Save document → Saving and indexing… → Indexed (≈800ms) → banner
  // Hold the "Indexed" label briefly after a successful submit so the user
  // perceives the success state before the form swaps out for the banner.
  useEffect(() => {
    if (!submitState.success) return;
    setShowIndexedFlash(true);
    const t = setTimeout(() => setShowIndexedFlash(false), 800);
    return () => clearTimeout(t);
  }, [submitState.success]);

  async function handleExtractSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCheckError(null);

    if (!title?.trim()) {
      setCheckError("Document title is required");
      return;
    }
    if (!content?.trim()) {
      setCheckError("Document content is required");
      return;
    }

    // Path is required and must satisfy D-12 rules.
    const trimmedPath = path.trim();
    const localPathError = validatePathClient(trimmedPath);
    if (localPathError) {
      setPathError(localPathError);
      return;
    }

    const exists = await checkDocumentExists(companyId, title.trim());
    if (exists) {
      setCheckError(
        `A document named "${title.trim()}" already exists for this company.`,
      );
      return;
    }

    startChecking(() => {
      const formData = new FormData(formRef.current!);
      extractDispatch(formData);
    });
  }

  function handlePathChange(value: string) {
    setPath(value);
    // Lazy-validate: only clear the error once the user has changed the value.
    if (pathError) {
      setPathError(validatePathClient(value.trim()));
    }
  }

  const extracting = extractPending || checking;

  return (
    <main className="bg-zinc-950 font-sans">
      <header className="px-8 py-5 border-b border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-200">Add Document</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          Paste a policy document and AI will extract all IT-related policies.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-9rem)]">
        {/* Left column — input form */}
        <form
          ref={formRef}
          onSubmit={handleExtractSubmit}
          className="flex flex-col gap-5 p-8 border-r border-zinc-800"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="text-zinc-300 text-sm">
              Document Title
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., IT Security Policy 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-blue-600 focus-visible:ring-offset-zinc-950"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="path" className="text-zinc-300 text-sm">
              Document path
            </Label>
            <Input
              id="path"
              name="path"
              placeholder="/research/papers/q4-strategy.md"
              value={path}
              onChange={(e) => handlePathChange(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-blue-600 focus-visible:ring-offset-zinc-950"
            />
            <p className="text-xs text-zinc-500">
              Where this document lives in the virtual corpus. Must start with
              &quot;/&quot;. Letters, numbers, dashes, dots and slashes only.
            </p>
            {pathError ? (
              <p className="text-sm text-red-400">{pathError}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-h-0">
            <Label htmlFor="content" className="text-zinc-300 text-sm">
              Document Content
            </Label>
            <textarea
              id="content"
              name="content"
              placeholder="Paste your document text here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-[400px] resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <Switch
                id="extractPolicies"
                checked={extractPoliciesToggle}
                onCheckedChange={setExtractPoliciesToggle}
              />
              <Label htmlFor="extractPolicies" className="text-zinc-300 text-sm">
                Also extract IT policies
              </Label>
            </div>
            <p className="text-xs text-zinc-500">
              Runs the existing policy extractor in addition to indexing.
              Defaults off.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apiKey" className="text-zinc-300 text-sm">
              Anthropic API Key
            </Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              placeholder="sk-ant-... (leave blank to use server key)"
              className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-blue-600 focus-visible:ring-offset-zinc-950"
            />
          </div>

          {(checkError || extractState.error) && (
            <p className="text-red-400 text-sm">
              {checkError ?? extractState.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={extracting}
            className="bg-blue-600 hover:bg-blue-500 text-white border-transparent px-6 py-2.5 h-auto rounded-[10px] font-medium transition-colors"
          >
            {extracting ? "Extracting policies..." : "Extract IT Policies"}
          </Button>
        </form>

        {/* Right column — results */}
        <div className="flex flex-col p-8">
          <div className="flex-1">
            {!extractState.policies ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-1">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 4h8l4 4v8H4V4z"
                      stroke="#52525b"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M12 4v4h4"
                      stroke="#52525b"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M7 10h6M7 13h4"
                      stroke="#52525b"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                  Submit a document to extract IT-related policies.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="text-zinc-300 font-semibold text-base mb-1">
                  {extractState.policies.length}{" "}
                  {extractState.policies.length === 1 ? "policy" : "policies"}{" "}
                  extracted
                </h2>

                {extractState.policies.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    No IT-related policies found in this document.
                  </p>
                ) : (
                  extractState.policies.map((policy, index) => (
                    <PolicyCard key={index} policy={policy} />
                  ))
                )}
              </div>
            )}
          </div>

          {extractState.policies && extractState.policies.length > 0 && (
            <div className="mt-6 pt-4 border-t border-zinc-800">
              {submitState.success && !showIndexedFlash ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-[10px] border border-green-800 bg-green-950/40 px-5 py-3">
                    <p className="text-green-400 font-medium text-sm">
                      Document indexed and ready for research.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="shrink-0 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 border-transparent px-5 py-2.5 h-auto rounded-[10px] font-medium transition-colors"
                  >
                    Submit more
                  </Button>
                </div>
              ) : (
                <form action={submitAction}>
                  <input type="hidden" name="title" value={title} />
                  <input type="hidden" name="content" value={content} />
                  <input type="hidden" name="companyId" value={companyId} />
                  <input type="hidden" name="path" value={path} />
                  <input
                    type="hidden"
                    name="extractPolicies"
                    value={extractPoliciesToggle ? "true" : "false"}
                  />
                  {submitState.error && (
                    <p className="text-red-400 text-sm mb-3">
                      {submitState.error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={submitPending || submitState.success}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white border-transparent px-6 py-2.5 h-auto rounded-[10px] font-medium transition-colors"
                  >
                    {submitState.success
                      ? "Indexed"
                      : submitPending
                        ? "Saving and indexing…"
                        : "Save document"}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
