"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// --- Syntax-highlighted code (manual spans, no library) ---
function CodeLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("leading-6 whitespace-pre", className)}>{children}</div>;
}

const K = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "#c792ea" }}>{children}</span>
);
const Fn = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "#82aaff" }}>{children}</span>
);
const Str = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "#c3e88d" }}>{children}</span>
);
const Tag = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "#f07178" }}>{children}</span>
);
const Attr = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "#ffcb6b" }}>{children}</span>
);
const Cmt = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "#546e7a", fontStyle: "italic" }}>{children}</span>
);
const Punct = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "#89ddff" }}>{children}</span>
);
const Num = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "#f78c6c" }}>{children}</span>
);

function SyntaxCode() {
  return (
    <code className="font-mono text-[13px] text-[#d4d4d8] block">
      <CodeLine><Cmt>{"// UserTable.tsx"}</Cmt></CodeLine>
      <CodeLine><K>import </K><Punct>{"{"}</Punct> <Fn>useState</Fn> <Punct>{"}"}</Punct> <K>from </K><Str>{'"react"'}</Str><Punct>;</Punct></CodeLine>
      <CodeLine />
      <CodeLine><K>type </K><Fn>User</Fn> <Punct>{"= {"}</Punct></CodeLine>
      <CodeLine>{"  "}<Attr>id</Attr><Punct>:</Punct> <K>number</K><Punct>;</Punct></CodeLine>
      <CodeLine>{"  "}<Attr>name</Attr><Punct>:</Punct> <K>string</K><Punct>;</Punct></CodeLine>
      <CodeLine>{"  "}<Attr>role</Attr><Punct>:</Punct> <K>string</K><Punct>;</Punct></CodeLine>
      <CodeLine>{"  "}<Attr>status</Attr><Punct>:</Punct> <Str>{'"active"'}</Str> <Punct>|</Punct> <Str>{'"away"'}</Str><Punct>;</Punct></CodeLine>
      <CodeLine><Punct>{"}"}</Punct></CodeLine>
      <CodeLine />
      <CodeLine><K>export default function </K><Fn>UserTable</Fn><Punct>{"() {"}</Punct></CodeLine>
      <CodeLine>{"  "}<K>const </K><Punct>[</Punct><Attr>users</Attr><Punct>]</Punct> <Punct>=</Punct> <Fn>useState</Fn><Punct>{"<"}</Punct><Fn>User</Fn><Punct>{"[]>"}</Punct><Punct>{"([])"}</Punct></CodeLine>
      <CodeLine />
      <CodeLine>{"  "}<K>return </K><Punct>{"("}</Punct></CodeLine>
      <CodeLine>{"    "}<Punct>{"<"}</Punct><Tag>div</Tag> <Attr>className</Attr><Punct>=</Punct><Str>{'"table-wrap"'}</Str><Punct>{">"}</Punct></CodeLine>
      <CodeLine>{"      "}<Punct>{"<"}</Punct><Tag>table</Tag><Punct>{">"}</Punct></CodeLine>
      <CodeLine>{"        "}<Punct>{"{"}</Punct>users<Punct>.</Punct><Fn>map</Fn><Punct>{"(u => ("}</Punct></CodeLine>
      <CodeLine>{"          "}<Punct>{"<"}</Punct><Tag>tr</Tag> <Attr>key</Attr><Punct>=</Punct><Punct>{"{"}</Punct>u<Punct>.</Punct><Attr>id</Attr><Punct>{"}"}</Punct><Punct>{">"}</Punct></CodeLine>
      <CodeLine>{"            "}<Punct>{"<"}</Punct><Tag>td</Tag><Punct>{">"}</Punct><Punct>{"{"}</Punct>u<Punct>.</Punct><Attr>name</Attr><Punct>{"}"}</Punct><Punct>{"</"}</Punct><Tag>td</Tag><Punct>{">"}</Punct></CodeLine>
      <CodeLine>{"          "}<Punct>{"</"}</Punct><Tag>tr</Tag><Punct>{">"}</Punct></CodeLine>
      <CodeLine>{"        "}<Punct>{"))"}</Punct><Punct>{"}"}</Punct></CodeLine>
      <CodeLine>{"      "}<Punct>{"</"}</Punct><Tag>table</Tag><Punct>{">"}</Punct></CodeLine>
      <CodeLine>{"    "}<Punct>{"</"}</Punct><Tag>div</Tag><Punct>{">"}</Punct></CodeLine>
      <CodeLine>{"  "}<Punct>{")"}</Punct></CodeLine>
      <CodeLine><Punct>{"}"}</Punct></CodeLine>
      <CodeLine />
      <CodeLine><Cmt>{"// lines: "}</Cmt><Num>24</Num></CodeLine>
    </code>
  );
}

// --- File Tree ---
const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 opacity-70">
    <path d="M3 2h5.5L11 4.5V12H3V2z" stroke="#7c8ba1" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    <path d="M8.5 2v2.5H11" stroke="#7c8ba1" strokeWidth="1.2" fill="none" />
  </svg>
);

const FolderIcon = ({ open }: { open?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 opacity-70">
    <path d={open ? "M1 4h12v8H1V4z" : "M1 4h5l1.5-1.5H13V12H1V4z"} stroke="#7c8ba1" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    {open && <path d="M1 4l1.5-1.5H7L8.5 4" stroke="#7c8ba1" strokeWidth="1.2" fill="none" />}
  </svg>
);

function FileTree() {
  return (
    <div className="font-mono text-[12px] text-[#8b9bb4] select-none">
      <div className="flex items-center gap-1.5 py-0.5 text-[#c9d1d9] font-medium">
        <FolderIcon open />
        <span>gigablocks-app</span>
      </div>
      <div className="ml-3 border-l border-[#2a2d3a] pl-2">
        <div className="flex items-center gap-1.5 py-0.5">
          <FolderIcon open />
          <span>components</span>
        </div>
        <div className="ml-3 border-l border-[#2a2d3a] pl-2">
          <div className="flex items-center gap-1.5 py-0.5 text-[#82aaff] bg-[#1e2333] rounded px-1 -ml-1">
            <FileIcon />
            <span>UserTable.tsx</span>
          </div>
          <div className="flex items-center gap-1.5 py-0.5">
            <FileIcon />
            <span>Sidebar.tsx</span>
          </div>
          <div className="flex items-center gap-1.5 py-0.5">
            <FileIcon />
            <span>Header.tsx</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Preview Panel Users ---
const users = [
  { id: 1, name: "Alice Martin", role: "Admin", status: "active" as const },
  { id: 2, name: "Bob Chen", role: "Editor", status: "active" as const },
  { id: 3, name: "Carla Torres", role: "Viewer", status: "away" as const },
  { id: 4, name: "David Park", role: "Editor", status: "active" as const },
];

function PreviewPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-[#1e2030] bg-[#13131a]">
        <span className="text-[11px] font-semibold tracking-widest text-[#5c6370] uppercase">
          Preview — edit environment
        </span>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <div className="rounded-lg border border-[#1e2030] overflow-hidden text-[12px]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#13131a] border-b border-[#1e2030]">
                <th className="text-left px-3 py-2 text-[#5c6370] font-medium">Name</th>
                <th className="text-left px-3 py-2 text-[#5c6370] font-medium">Role</th>
                <th className="text-left px-3 py-2 text-[#5c6370] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className={cn(
                    "border-b border-[#1e2030] last:border-0",
                    i % 2 === 0 ? "bg-[#0e0e14]" : "bg-[#11111a]"
                  )}
                >
                  <td className="px-3 py-2 text-[#c9d1d9] font-medium">{user.name}</td>
                  <td className="px-3 py-2 text-[#8b9bb4]">{user.role}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        user.status === "active"
                          ? "bg-emerald-950 text-emerald-400"
                          : "bg-amber-950 text-amber-400"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          user.status === "active" ? "bg-emerald-400" : "bg-amber-400"
                        )}
                      />
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Browser Chrome ---
function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2030] shadow-2xl shadow-black/60">
      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#13131a] border-b border-[#1e2030]">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e] shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-[#28c840] shadow-sm" />
        </div>
        {/* Tab */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-t-md bg-[#0c0c0e] border border-b-0 border-[#1e2030] ml-2">
          <span className="w-3 h-3 rounded-sm bg-[#82aaff]/30 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#82aaff]/60" />
          </span>
          <span className="text-[11px] text-[#8b9bb4]">UserTable.tsx — Gigablocks</span>
        </div>
      </div>
      {children}
    </div>
  );
}

// --- Main Component ---
export function EditorMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      style={{ backgroundColor: "#0c0c0e" }}
      className="w-full py-24 px-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest text-[#5c6370] uppercase mb-3">
            Product
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your stack, your rules
          </h2>
          <p className="text-[#8b9bb4] max-w-xl mx-auto">
            Write real code, preview instantly — Gigablocks keeps your team
            in sync without slowing you down.
          </p>
        </div>

        {/* Editor mockup */}
        <div
          ref={ref}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <BrowserChrome>
            <div className="flex bg-[#0d0d14] min-h-[380px]">
              {/* Left: File tree */}
              <div className="hidden md:block w-44 shrink-0 border-r border-[#1e2030] p-3 bg-[#0a0a10]">
                <p className="text-[10px] font-semibold tracking-widest text-[#3d4558] uppercase mb-3 px-1">
                  Explorer
                </p>
                <FileTree />
              </div>

              {/* Center: Code */}
              <div className="flex-1 overflow-auto p-4 bg-[#0d0d14]">
                <SyntaxCode />
              </div>

              {/* Right: Preview */}
              <div className="hidden md:flex flex-col w-64 shrink-0 border-l border-[#1e2030] bg-[#0e0e14]">
                <PreviewPanel />
              </div>
            </div>

            {/* Mobile: code + preview stacked (visible below md) */}
            <div className="md:hidden flex flex-col bg-[#0d0d14] border-t border-[#1e2030]">
              <div className="p-4 border-b border-[#1e2030]">
                <SyntaxCode />
              </div>
              <PreviewPanel />
            </div>
          </BrowserChrome>
        </div>
      </div>
    </section>
  );
}
