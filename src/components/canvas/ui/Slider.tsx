"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";
import { useFormField } from "./_hooks/useFormField";

interface SliderProps {
  label?: string | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;
  value?: number | null;
}

export function Slider({
  props,
  bindings,
  emit,
}: BaseComponentProps<SliderProps>) {
  const min = props.min ?? 0;
  const max = props.max ?? 100;

  const { value, setValue } = useFormField<number>({
    propValue: props.value,
    bindingPath: bindings?.value,
    defaultValue: min,
    checks: null,
    validateOn: null,
    defaultValidateOn: "change",
  });

  const numValue = typeof value === "number" ? value : min;
  const pct = ((numValue - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2.5">
      {props.label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            {props.label}
          </span>
          <span className="text-xs font-medium text-zinc-400 tabular-nums">
            {numValue}
          </span>
        </div>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={props.step ?? 1}
        value={numValue}
        onChange={(e) => {
          setValue(parseFloat(e.target.value));
          emit("change");
        }}
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, #27272a ${pct}%, #27272a 100%)`,
        }}
        className={cn(
          "w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-white",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500",
          "[&::-webkit-slider-thumb]:cursor-pointer",
          "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100",
          "[&::-webkit-slider-thumb]:hover:scale-110",
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2",
          "[&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:bg-white",
          "[&::-moz-range-thumb]:cursor-pointer",
        )}
      />
    </div>
  );
}
