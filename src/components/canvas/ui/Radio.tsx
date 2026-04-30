"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";
import { useFormField } from "./_hooks/useFormField";

interface RadioProps {
  label: string;
  name: string;
  options: string[];
  value?: string | null;
  checks?: Array<{
    type: string;
    message: string;
    args?: Record<string, unknown>;
  }> | null;
  validateOn?: "change" | "blur" | "submit" | null;
}

export function Radio({
  props,
  bindings,
  emit,
}: BaseComponentProps<RadioProps>) {
  const options = (props.options ?? []).map((o) =>
    typeof o === "string" ? o : String(o ?? ""),
  );

  const {
    value,
    setValue,
    errors,
    validate,
    hasValidation,
    resolvedValidateOn,
  } = useFormField<string>({
    propValue: props.value,
    bindingPath: bindings?.value,
    defaultValue: options[0] ?? "",
    checks: props.checks,
    validateOn: props.validateOn,
    defaultValidateOn: "change",
  });

  const handleSelect = (option: string) => {
    setValue(option);
    if (hasValidation && resolvedValidateOn === "change") validate();
    emit("change");
  };

  return (
    <div className="flex flex-col gap-2">
      {props.label && (
        <span className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
          {props.label}
        </span>
      )}

      <div className="flex flex-col gap-2">
        {options.map((option, idx) => {
          const isSelected = value === option;
          const id = `${props.name}-${idx}`;

          return (
            <label
              key={id}
              className="group flex cursor-pointer items-center gap-3 select-none"
            >
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                id={id}
                onClick={() => handleSelect(option)}
                style={
                  isSelected
                    ? { boxShadow: "0 0 10px rgba(59,130,246,0.4)" }
                    : undefined
                }
                className={cn(
                  "relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                  "transition-all duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
                  isSelected
                    ? "bg-black border-2 border-blue-500"
                    : "bg-black border border-white/15 group-hover:border-white/30",
                )}
              >
                <span
                  className={cn(
                    "block rounded-full bg-blue-500 transition-all duration-150 ease-out",
                    isSelected
                      ? "h-[7px] w-[7px] opacity-100"
                      : "h-0 w-0 opacity-0",
                  )}
                  style={
                    isSelected
                      ? {
                          animation:
                            "canvas-dot-spring 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards",
                        }
                      : undefined
                  }
                />
              </button>

              <span
                className={cn(
                  "text-sm leading-none transition-colors duration-100",
                  isSelected
                    ? "text-white"
                    : "text-zinc-400 group-hover:text-zinc-300",
                )}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>

      {errors.length > 0 && <p className="text-xs text-red-400">{errors[0]}</p>}
    </div>
  );
}
