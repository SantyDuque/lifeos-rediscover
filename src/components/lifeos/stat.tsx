import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  hint,
  className,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("panel px-4 py-3.5", className)}>
      <p className="text-[11px] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="num mt-1.5 text-2xl text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}
