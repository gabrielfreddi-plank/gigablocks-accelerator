import { type InputHTMLAttributes, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function AuthInput({ label, className, ...props }: AuthInputProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm text-zinc-400">
        {label}
      </Label>
      <Input
        id={id}
        className={cn(
          "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600",
          "focus-visible:ring-blue-500/50 focus-visible:border-blue-500",
          className
        )}
        {...props}
      />
    </div>
  );
}
