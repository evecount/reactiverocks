"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

const CircularProgress = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement> & { value: number, max: number }
>(({ className, value, max, ...props }, ref) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;

  return (
    <svg
      ref={ref}
      className={cn("w-full h-full", className)}
      viewBox="0 0 100 100"
      {...props}
    >
      <circle
        className="text-primary/20"
        stroke="currentColor"
        strokeWidth="5"
        fill="transparent"
        r={radius}
        cx="50"
        cy="50"
      />
      <circle
        className="text-primary transition-all duration-300"
        stroke="currentColor"
        strokeWidth="5"
        fill="transparent"
        r={radius}
        cx="50"
        cy="50"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
});
CircularProgress.displayName = "CircularProgress";


export { Progress, CircularProgress }
