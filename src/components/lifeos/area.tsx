import { cn } from "@/lib/utils";
import type { LifeArea } from "@/lib/types";

// Static class maps so Tailwind can see every class literal.
export const areaText: Record<LifeArea, string> = {
  health: "text-area-health",
  mind: "text-area-mind",
  craft: "text-area-craft",
  people: "text-area-people",
  money: "text-area-money",
  home: "text-area-home",
};

export const areaBg: Record<LifeArea, string> = {
  health: "bg-area-health",
  mind: "bg-area-mind",
  craft: "bg-area-craft",
  people: "bg-area-people",
  money: "bg-area-money",
  home: "bg-area-home",
};

export const areaVar: Record<LifeArea, string> = {
  health: "var(--area-health)",
  mind: "var(--area-mind)",
  craft: "var(--area-craft)",
  people: "var(--area-people)",
  money: "var(--area-money)",
  home: "var(--area-home)",
};

export const areaLabel: Record<LifeArea, string> = {
  health: "Health",
  mind: "Mind",
  craft: "Craft",
  people: "People",
  money: "Money",
  home: "Home",
};

export function AreaDot({ area, className }: { area: LifeArea; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-1.5 shrink-0 rounded-full", areaBg[area], className)}
    />
  );
}

export function AreaTag({ area, className }: { area: LifeArea; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      <AreaDot area={area} />
      {areaLabel[area]}
    </span>
  );
}
