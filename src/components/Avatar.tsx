import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  src?: string | null;
  color?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  ring?: boolean;
};

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
  "2xl": "h-28 w-28 text-4xl",
};

/**
 * 26 distinct hue gradients — one per letter A–Z. Non-letters fall back to a
 * neutral slate. Tuned for legibility on the dark theme using oklch.
 */
const LETTER_GRADIENTS: Record<string, string> = {
  A: "linear-gradient(135deg, oklch(0.70 0.18 25), oklch(0.55 0.20 18))",
  B: "linear-gradient(135deg, oklch(0.72 0.16 45), oklch(0.55 0.19 38))",
  C: "linear-gradient(135deg, oklch(0.78 0.15 70), oklch(0.60 0.18 60))",
  D: "linear-gradient(135deg, oklch(0.80 0.16 95), oklch(0.62 0.18 85))",
  E: "linear-gradient(135deg, oklch(0.78 0.18 120), oklch(0.58 0.20 130))",
  F: "linear-gradient(135deg, oklch(0.72 0.20 145), oklch(0.52 0.22 150))",
  G: "linear-gradient(135deg, oklch(0.70 0.18 165), oklch(0.50 0.20 170))",
  H: "linear-gradient(135deg, oklch(0.72 0.16 185), oklch(0.52 0.18 190))",
  I: "linear-gradient(135deg, oklch(0.74 0.15 205), oklch(0.54 0.18 210))",
  J: "linear-gradient(135deg, oklch(0.72 0.16 220), oklch(0.52 0.20 225))",
  K: "linear-gradient(135deg, oklch(0.70 0.18 240), oklch(0.50 0.22 245))",
  L: "linear-gradient(135deg, oklch(0.68 0.20 260), oklch(0.48 0.22 265))",
  M: "linear-gradient(135deg, oklch(0.68 0.22 280), oklch(0.48 0.24 285))",
  N: "linear-gradient(135deg, oklch(0.70 0.20 300), oklch(0.50 0.22 305))",
  O: "linear-gradient(135deg, oklch(0.72 0.20 320), oklch(0.52 0.22 325))",
  P: "linear-gradient(135deg, oklch(0.74 0.20 340), oklch(0.54 0.22 345))",
  Q: "linear-gradient(135deg, oklch(0.72 0.22 355), oklch(0.52 0.24 5))",
  R: "linear-gradient(135deg, oklch(0.68 0.20 15), oklch(0.50 0.22 10))",
  S: "linear-gradient(135deg, oklch(0.74 0.16 35), oklch(0.56 0.20 30))",
  T: "linear-gradient(135deg, oklch(0.78 0.16 55), oklch(0.58 0.20 50))",
  U: "linear-gradient(135deg, oklch(0.78 0.16 80), oklch(0.58 0.20 75))",
  V: "linear-gradient(135deg, oklch(0.76 0.18 110), oklch(0.56 0.20 105))",
  W: "linear-gradient(135deg, oklch(0.72 0.20 135), oklch(0.52 0.22 140))",
  X: "linear-gradient(135deg, oklch(0.70 0.18 175), oklch(0.50 0.20 180))",
  Y: "linear-gradient(135deg, oklch(0.70 0.18 215), oklch(0.50 0.20 220))",
  Z: "linear-gradient(135deg, oklch(0.68 0.22 290), oklch(0.48 0.24 295))",
};
const NEUTRAL_GRADIENT = "linear-gradient(135deg, oklch(0.55 0.02 240), oklch(0.40 0.02 240))";

/** Pick a per-letter gradient or use the provided custom color. */
export function colorForName(name?: string | null, customColor?: string | null): string {
  if (customColor) {
    if (customColor.startsWith('linear-gradient')) return customColor;
    return `linear-gradient(135deg, ${customColor}, ${customColor})`;
  }
  const ch = (name ?? "").trim()?.[0]?.toUpperCase();
  if (!ch) return NEUTRAL_GRADIENT;
  return LETTER_GRADIENTS[ch] ?? NEUTRAL_GRADIENT;
}

/** Round avatar with image fallback to first-letter monogram, colored by initial or custom color. */
export function Avatar({ name, src, color, size = "md", className, ring }: Props) {
  const initial = (name ?? "").trim()?.[0]?.toUpperCase() || "?";
  const cls = cn(
    "relative grid place-items-center rounded-full font-semibold text-white shadow-glow shrink-0 select-none overflow-hidden",
    SIZES[size],
    ring && "ring-2 ring-primary/60 ring-offset-2 ring-offset-background",
    className,
  );
  const bg = colorForName(name, color);
  
  if (src) {
    return (
      <span className={cls} style={{ backgroundImage: bg }}>
        <img src={src} alt={name ?? "Avatar"} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      </span>
    );
  }
  return <span className={cls} style={{ backgroundImage: bg }}>{initial}</span>;
}
