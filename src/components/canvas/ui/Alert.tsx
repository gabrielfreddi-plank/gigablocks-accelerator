"use client";

import type { BaseComponentProps } from "@json-render/react";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface AlertProps {
  title: string;
  message?: string | null;
  type?: "info" | "success" | "warning" | "error" | null;
}

const typeConfig = {
  info:    { icon: Info,          border: "border-blue-500",    bg: "bg-blue-500/6",    text: "text-blue-400",    title: "text-blue-300"    },
  success: { icon: CheckCircle,   border: "border-emerald-500", bg: "bg-emerald-500/6", text: "text-emerald-400", title: "text-emerald-300" },
  warning: { icon: AlertTriangle, border: "border-amber-500",   bg: "bg-amber-500/6",   text: "text-amber-400",   title: "text-amber-300"   },
  error:   { icon: XCircle,       border: "border-red-500",     bg: "bg-red-500/6",     text: "text-red-400",     title: "text-red-300"     },
};

export function Alert({ props }: BaseComponentProps<AlertProps>) {
  const type = props.type ?? "info";
  const config = typeConfig[type] ?? typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={cn("flex gap-3 rounded-xl border-l-2 px-4 py-3.5", config.border, config.bg)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.text)} />
      <div className="flex flex-col gap-0.5">
        <p className={cn("text-sm font-medium", config.title)}>{props.title}</p>
        {props.message && (
          <p className={cn("text-xs leading-relaxed", config.text)}>{props.message}</p>
        )}
      </div>
    </div>
  );
}
