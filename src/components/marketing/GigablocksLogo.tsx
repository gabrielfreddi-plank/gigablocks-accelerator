import Link from "next/link"
import { cn } from "@/lib/utils"

interface GigablocksLogoProps {
  className?: string
  textClassName?: string
  iconClassName?: string
}

export function GigablocksLogo({
  className,
  textClassName,
  iconClassName,
}: GigablocksLogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={iconClassName}
      >
        <rect width="28" height="28" rx="6" fill="#3B82F6" />
        <rect x="7" y="7" width="6" height="6" rx="1" fill="white" />
        <rect x="15" y="7" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
        <rect x="7" y="15" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
        <rect x="15" y="15" width="6" height="6" rx="1" fill="white" />
      </svg>
      <span className={cn("text-white font-semibold text-lg tracking-tight", textClassName)}>
        Gigablocks
      </span>
    </Link>
  )
}
