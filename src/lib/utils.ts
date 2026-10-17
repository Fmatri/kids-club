import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine des classes Tailwind proprement :
// cn("px-4", condition && "bg-encre") → garde seulement les classes utiles
// et règle les conflits (ex. "p-2" puis "p-4" → garde "p-4").
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}