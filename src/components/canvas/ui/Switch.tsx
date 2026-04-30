"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";
import { useFormField } from "./_hooks/useFormField";

interface SwitchProps {
  label: string;
  name: string;
  checked?: boolean | null;
  checks?: Array<{ type: string; message: string; args?: Record<string, unknown> }> | null;
  validateOn?: "change" | "blur" | "submit" | null;
}

export function Switch({ props, bindings, emit }: BaseComponentProps<SwitchProps>) {
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
      <label className="group flex cursor-pointer items-center justify-between gap-4 select-none">
        <span className={cn("text-sm leading-none transition-colors duration-100", checked ? "text-white" : "text-zinc-400 group-hover:text-zinc-300")}>
          {props.label}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          id={props.name}
          onClick={handleChange}
          style={checked ? { boxShadow: "0 0 10px rgba(59,130,246,0.4)" } : undefined}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full border transition-all duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
            checked
              ? "bg-blue-600 border-blue-500/40"
              : "bg-black border-white/15 group-hover:border-white/25",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
              checked ? "translate-x-[22px]" : "translate-x-0.5",
            )}
          />
        </button>
      </label>

      {errors.length > 0 && (
        <p className="text-xs text-red-400">{errors[0]}</p>
      )}
    </div>
  );
}
