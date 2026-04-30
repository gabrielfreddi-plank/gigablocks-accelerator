"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";
import { useFormField } from "./_hooks/useFormField";

interface TextareaProps {
  label: string;
  name: string;
  placeholder?: string | null;
  rows?: number | null;
  value?: string | null;
  hint?: string | null;
  checks?: Array<{
    type: string;
    message: string;
    args?: Record<string, unknown>;
  }> | null;
  validateOn?: "change" | "blur" | "submit" | null;
}

export function Textarea({
  props,
  bindings,
  emit,
}: BaseComponentProps<TextareaProps>) {
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
    defaultValue: "",
    checks: props.checks,
    validateOn: props.validateOn,
    defaultValidateOn: "blur",
  });

  const hasError = errors.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={props.name}
        className="text-xs font-medium text-zinc-500 tracking-wide uppercase"
      >
        {props.label}
      </label>

      <textarea
        id={props.name}
        name={props.name}
        placeholder={props.placeholder ?? ""}
        rows={props.rows ?? 3}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (hasValidation && resolvedValidateOn === "change") validate();
        }}
        onBlur={() => {
          if (hasValidation && resolvedValidateOn === "blur") validate();
          emit("blur");
        }}
        className={cn(
          "w-full rounded-lg px-3 py-2.5 text-sm text-white",
          "bg-black outline-none resize-none",
          "placeholder:text-zinc-600",
          "transition-colors duration-150",
          hasError
            ? "border border-red-500/60 focus:border-red-400/80"
            : "border border-white/10 focus:border-blue-500/60",
        )}
      />

      {hasError ? (
        <p className="text-xs text-red-400">{errors[0]}</p>
      ) : props.hint ? (
        <p className="text-xs text-zinc-600">{props.hint}</p>
      ) : null}
    </div>
  );
}
