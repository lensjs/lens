import { twMerge } from "tailwind-merge";

type ClassValue = string | number | null | false | undefined;

/**
 * Merge conditional Tailwind class names, resolving conflicts (last wins).
 * Accepts strings and falsy values (e.g. `cn("p-2", active && "bg-blue-500")`).
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
