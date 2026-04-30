"use client";

import { useState } from "react";
import { useBoundProp, useFieldValidation } from "@json-render/react";

type Check = { type: string; message: string; args?: Record<string, unknown> };
type ValidateOn = "change" | "blur" | "submit";

interface UseFormFieldOptions<T> {
  propValue: T | null | undefined;
  bindingPath: string | undefined;
  defaultValue: T;
  checks: Check[] | null | undefined;
  validateOn: ValidateOn | null | undefined;
  defaultValidateOn: ValidateOn;
}

export function useFormField<T>({
  propValue,
  bindingPath,
  defaultValue,
  checks,
  validateOn,
  defaultValidateOn,
}: UseFormFieldOptions<T>) {
  const [boundValue, setBoundValue] = useBoundProp<T>(
    propValue ?? undefined,
    bindingPath,
  );
  const [localValue, setLocalValue] = useState<T>(
    (propValue ?? defaultValue) as T,
  );

  const isBound = !!bindingPath;
  const value = isBound ? (boundValue ?? defaultValue) : localValue;
  const setValue = isBound ? (setBoundValue as (v: T) => void) : setLocalValue;

  const resolvedValidateOn = validateOn ?? defaultValidateOn;
  const hasValidation = !!(bindingPath && checks?.length);

  const { errors, validate } = useFieldValidation(
    bindingPath ?? "",
    hasValidation
      ? { checks: checks ?? [], validateOn: resolvedValidateOn }
      : undefined,
  );

  return {
    value,
    setValue,
    errors,
    validate,
    hasValidation,
    resolvedValidateOn,
  };
}
