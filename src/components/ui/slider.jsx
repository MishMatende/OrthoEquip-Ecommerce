// src/components/ui/slider.jsx
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../lib/utils";

/**
 * Minimal uncontrolled Radix Slider wrapper for a 2-thumb range.
 * - Always renders 2 thumbs (for price range)
 * - Forwards onValueChange and onValueCommit only
 * - Uses defaultValue to let Radix manage internal dragging
 */
function Slider({
  className,
  defaultValue = [0, 100],
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommit,
  ...props
}) {
  return (
    <SliderPrimitive.Root
      defaultValue={defaultValue}
      min={min}
      max={max}
      step={step}
      onValueChange={onValueChange}
      onValueCommit={onValueCommit}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="bg-muted relative grow overflow-hidden rounded-full h-1.5">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb className="block w-4 h-4 rounded-full bg-white shadow border" />
      <SliderPrimitive.Thumb className="block w-4 h-4 rounded-full bg-white shadow border" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
