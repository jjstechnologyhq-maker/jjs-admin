"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Search box with a leading icon, matching the input style used across the dashboard. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <div className={cn("relative w-full sm:w-72", className)}>
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input
        className={cn("pl-8", inputClassName)}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
