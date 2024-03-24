import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Easily combine and override tailwind classes */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const EMPTY_ARRAY: never[] = [];
