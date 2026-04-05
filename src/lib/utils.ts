import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert any CSS color string to an rgba() string with the given alpha.
 * Handles rgb(), rgba(), hex (#rrggbb / #rgb), and named colors.
 */
export function toRgba(color: string, alpha: number): string {
  const trimmed = color.trim();

  // Already rgb()/rgba() — extract channels and apply alpha
  if (trimmed.startsWith('rgb')) {
    const match = trimmed.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
    }
  }

  // Hex color (#rrggbb or #rgb)
  const hexMatch3 = trimmed.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (hexMatch3) {
    const r = parseInt(hexMatch3[1] + hexMatch3[1], 16);
    const g = parseInt(hexMatch3[2] + hexMatch3[2], 16);
    const b = parseInt(hexMatch3[3] + hexMatch3[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const hexMatch6 = trimmed.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch6) {
    const r = parseInt(hexMatch6[1], 16);
    const g = parseInt(hexMatch6[2], 16);
    const b = parseInt(hexMatch6[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Fallback: return as-is
  return trimmed;
}
