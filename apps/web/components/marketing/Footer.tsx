import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Security", href: "#" },
  { label: "Status", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "GitHub", href: "#" },
];

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "bg-zinc-900 border-t border-zinc-700 px-6 py-10",
        className
      )}
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Logo + wordmark + tagline */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-600 inline-block shrink-0" aria-hidden="true" />
            <span className="text-white font-semibold text-lg leading-none">Gigablocks</span>
          </div>
          <p className="text-zinc-500 text-sm">
            The internal tools platform for modern teams.
          </p>
        </div>

        {/* Nav links */}
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Copyright */}
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          © 2026 Gigablocks Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
