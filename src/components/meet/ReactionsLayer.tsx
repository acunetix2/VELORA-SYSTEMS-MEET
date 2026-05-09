import { useEffect, useState } from "react";

export type Reaction = { id: string; emoji: string; from: string; ts: number };

const EMOJI_ASSETS: Record<string, string> = {
  "👍": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp",
  "❤️": "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp",
  "🎉": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp",
  "👏": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp",
  "😂": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp",
  "😮": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e/512.webp",
  "🙏": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.webp",
  "🔥": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp",
};

/** Floating, auto-disappearing emoji reactions overlay (Zoom-style). */
export function ReactionsLayer({ reactions }: { reactions: Reaction[] }) {
  // Filter to only those <4s old so we never render stale items after re-mount.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const visible = reactions.filter((r) => now - r.ts < 4000);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {visible.map((r) => {
        // Stable horizontal position derived from id
        const seed = parseInt(r.id.slice(0, 8), 16) || 1;
        const left = 10 + (seed % 80); // 10–90%
        const drift = ((seed >> 4) % 30) - 15; // -15..14 px sway
        const assetUrl = EMOJI_ASSETS[r.emoji];

        return (
          <div
            key={r.id}
            className="absolute bottom-4 flex flex-col items-center"
            style={{
              left: `${left}%`,
              transform: `translateX(${drift}px)`,
              animation: "reaction-rise 4s ease-out forwards",
            }}
          >
            {assetUrl ? (
              <img src={assetUrl} alt={r.emoji} className="h-16 w-16 object-contain drop-shadow-xl" />
            ) : (
              <span className="text-4xl drop-shadow-glow">{r.emoji}</span>
            )}
            <span className="text-[10px] glass rounded-full px-2 py-0.5 mt-1 text-foreground font-bold shadow-sm">
              {r.from}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes reaction-rise {
          0%   { transform: translateY(0)    scale(0.5); opacity: 0; }
          15%  { transform: translateY(-40px) scale(1.1); opacity: 1; }
          25%  { transform: translateY(-70px) scale(1);   opacity: 1; }
          90%  { transform: translateY(-280px) scale(1);  opacity: 1; }
          100% { transform: translateY(-340px) scale(0.9); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export const REACTION_EMOJIS = ["👍", "❤️", "🎉", "👏", "😂", "😮", "🙏", "🔥"] as const;