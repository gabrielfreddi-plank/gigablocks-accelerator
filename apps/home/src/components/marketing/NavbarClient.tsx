"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/actions/auth"

const navLinks = [
  { label: "Docs", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Changelog", href: "#" },
]

function GigablocksLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="28" height="28" rx="6" fill="#3B82F6" />
        <rect x="7" y="7" width="6" height="6" rx="1" fill="white" />
        <rect x="15" y="7" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
        <rect x="7" y="15" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
        <rect x="15" y="15" width="6" height="6" rx="1" fill="white" />
      </svg>
      <span className="text-white font-semibold text-lg tracking-tight">
        Gigablocks
      </span>
    </Link>
  )
}

interface NavbarClientProps {
  user: { displayName: string } | null
}

export function NavbarClient({ user }: NavbarClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-1">
            <GigablocksLogo />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="flex-1 hidden md:flex items-center justify-end gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <button type="button" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors">
                    Dashboard
                  </button>  
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="text-sm text-zinc-400 hover:text-zinc-50 font-medium transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
             
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center rounded-md p-2 text-zinc-400 hover:text-zinc-50 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-200",
          mobileOpen ? "max-h-96 border-t border-white/10" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-6 py-4 gap-1" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-50"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            {user ? (
              <>
                <span className="py-2 text-sm text-zinc-400">Welcome, {user.displayName}</span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
