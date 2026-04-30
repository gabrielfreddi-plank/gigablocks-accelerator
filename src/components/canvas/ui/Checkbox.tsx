"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";
import { useFormField } from "./_hooks/useFormField";

interface CheckboxProps {
  label: string;
  name: string;
  checked?: boolean | null;
  checks?: Array<{ type: string; message: string; args?: Record<string, unknown> }> | null;
  validateOn?: "change" | "blur" | "submit" | null;
}

export function Checkbox({ props, bindings, emit }: BaseComponentProps<CheckboxProps>) {
  const { value: checked, setValue: setChecked, errors, validate, hasValidation, resolvedValidateOn } =
    useFormField<boolean>({
      propValue: props.checked,
      bindingPath: bindings?.checked,
      defaultValue: false,
      checks: props.checks,
      validateOn: props.validateOn,
      defaultValidateOn: "change",
    });

  const handleChange = () => {
    const next = !checked;
    setChecked(next);
    if (hasValidation && resolvedValidateOn === "change") validate();
    emit("change");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="group flex cursor-pointer items-center gap-3 select-none">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          id={props.name}
          onClick={handleChange}
          style={checked ? { boxShadow: "0 0 10px rgba(59,130,246,0.4)" } : undefined}
          className={cn(
            "relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded",
            "transition-all duration-150 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
            checked
              ? "bg-blue-600 border border-blue-500/50"
              : "bg-black border border-white/15 group-hover:border-white/30",
          )}
        >
          <svg
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            className={cn(
              "transition-all duration-150",
              checked ? "opacity-100 scale-100" : "opacity-0 scale-50",
            )}
          >
            <path
              d="M1 3.5L3.8 6.5L9 1"
              stroke="white"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="20"
              strokeDashoffset={checked ? "0" : "20"}
              style={{ transition: "stroke-dashoffset 0.18s ease-out" }}
            />
          </svg>
        </button>

        <span className={cn(
          "text-sm leading-none transition-colors duration-100",
          checked ? "text-white" : "text-zinc-400 group-hover:text-zinc-300",
        )}>
          {props.label}
        </span>
      </label>

      {errors.length > 0 && (
        <p className="pl-7 text-xs text-red-400">{errors[0]}</p>
      )}
    </div>
  );
}
