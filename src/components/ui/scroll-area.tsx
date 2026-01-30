"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simplified ScrollArea that just uses native overflow
// This prevents the infinite loop issue from Radix ScrollArea
const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative overflow-auto", className)}
    {...props}
  >
    {children}
  </div>
));
ScrollArea.displayName = "ScrollArea"

// Simplified ScrollBar (not actually used, just for compatibility)
const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => null);
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }
