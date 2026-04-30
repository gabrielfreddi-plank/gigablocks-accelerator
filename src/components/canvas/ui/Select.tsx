"use client";

import type { BaseComponentProps } from "@json-render/react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFormField } from "./_hooks/useFormField";

interface SelectProps {
  label: string;
  name: string;
  options: string[];
  placeholder?: string | null;
  value?: string | null;
  checks?: Array<{ type: string; message: string; args?: Record<string, unknown> }> | null;
  validateOn?: "change" | "blur" | "submit" | null;
}

export function Select({ props, bindings, emit }: BaseComponentProps<SelectProps>) {
  const options = (props.options ?? []).map((o) => (typeof o === "string" ? o : String(o ?? "")));

  const { value, setValue, errors, validate, hasValidation, resolvedValidateOn } =
    useFormField<string>({
      propValue: props.value,
      bindingPath: bindings?.value,
      defaultValue: "",
      checks: props.checks,
      validateOn: props.validateOn,
      defaultValidateOn: "change",
    });

  const hasError = errors.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.name} className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
        {props.label}
      </label>

      <SelectPrimitive.Root
        value={value || undefined}
        onValueChange={(v) => {
          setValue(v);
          if (hasValidation && resolvedValidateOn === "change") validate();
          emit("change");
        }}
      >
        <SelectPrimitive.Trigger
          id={props.name}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg px-3 text-sm",
            "bg-black border transition-colors duration-150 outline-none",
            "data-[placeholder]:text-zinc-600",
            hasError
              ? "border-red-500/60 text-white focus:border-red-400/80"
              : "border-white/10 text-white focus:border-blue-500/60",
          )}
        >
          <SelectPrimitive.Value placeholder={props.placeholder ?? "Select…"} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className={cn(
              "z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl",
              "bg-zinc-950 border border-white/10 shadow-xl shadow-black/50",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            )}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt, idx) => (
                <SelectPrimitive.Item
                  key={`${idx}-${opt}`}
                  value={opt || `option-${idx}`}
                  className={cn(
                    "relative flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none",
                    "select-none transition-colors duration-100",
                    "data-[highlighted]:bg-white/5 data-[highlighted]:text-white",
                    "data-[state=checked]:text-white",
                  )}
                >
                  <SelectPrimitive.ItemText>{opt}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-3">
                    <Check className="h-3.5 w-3.5 text-blue-400" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {hasError && <p className="text-xs text-red-400">{errors[0]}</p>}
    </div>
  );
}
