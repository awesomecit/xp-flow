import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

/** Icona Material Symbols (font caricato nel root). */
export function Icon({
  name,
  className,
  size = 18,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined leading-none", className)}
      style={{ fontSize: `${size}px` }}
    >
      {name}
    </span>
  );
}

/** Etichetta tecnica in maiuscolo (label-caps del design system). */
export function LabelCaps({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export type PanelTone = "default" | "ok" | "blocked" | "action" | "escalation";

const TONE_BORDER: Record<PanelTone, string> = {
  default: "border-l-outline",
  ok: "border-l-ok",
  blocked: "border-l-blocked",
  action: "border-l-action",
  escalation: "border-l-escalation",
};

const TONE_TINT: Record<PanelTone, string> = {
  default: "",
  ok: "bg-ok-surface",
  blocked: "bg-blocked-surface",
  action: "bg-action-surface",
  escalation: "bg-escalation-surface",
};

/** Contenitore base: superficie + outline, accento a sinistra per lo stato. */
export function Panel({
  title,
  icon,
  aside,
  tone = "default",
  className,
  titleId,
  children,
  ...rest
}: {
  title?: ReactNode;
  icon?: string;
  aside?: ReactNode;
  tone?: PanelTone;
  className?: string;
  titleId?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "title">) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-md border border-outline/60 border-l-4 bg-surface p-4",
        TONE_BORDER[tone],
        tone !== "default" && TONE_TINT[tone],
        className,
      )}
      {...rest}
    >
      {(title || aside) && (
        <header className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="flex items-center gap-2">
            {icon ? <Icon name={icon} size={16} className="text-muted-foreground" /> : null}
            <LabelCaps
              className={
                tone === "action"
                  ? "text-action"
                  : tone === "blocked"
                    ? "text-blocked"
                    : tone === "ok"
                      ? "text-ok"
                      : undefined
              }
            >
              {title}
            </LabelCaps>
          </h2>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export type ChipTone = PanelTone | "pending";

const CHIP: Record<ChipTone, string> = {
  default: "border-outline/60 bg-surface-variant text-surface-variant-foreground",
  pending: "border-pending/40 bg-pending-surface text-muted-foreground",
  ok: "border-ok/40 bg-ok-surface text-ok",
  blocked: "border-blocked/40 bg-blocked-surface text-blocked",
  action: "border-action/50 bg-action-surface text-action",
  escalation: "border-escalation/40 bg-escalation-surface text-escalation",
};

export function Chip({
  tone = "default",
  children,
  className,
}: {
  tone?: ChipTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em]",
        CHIP[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Barra di avanzamento sottile (SP, scenari). */
export function Meter({
  value,
  max,
  tone = "primary",
}: {
  value: number;
  max: number;
  tone?: "primary" | "ok" | "blocked";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "ok" ? "bg-ok" : tone === "blocked" ? "bg-blocked" : "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function toneForOutcome(outcome?: string): ChipTone {
  switch (outcome) {
    case "chiuso":
      return "ok";
    case "bloccato":
      return "blocked";
    case "azione_manuale":
      return "action";
    case "escalation":
      return "escalation";
    case "in_corso":
      return "default";
    default:
      return "pending";
  }
}

/** Timestamp compatto e leggibile (HH:MM:SS + data breve). */
export function formatTs(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Come `toneForOutcome`, ma senza rosso: il rosso è riservato alla zona
 * "Serve da te" della dashboard (unico punto in cui la UI chiama l'utente).
 */
export function toneForOutcomeNeutral(esito?: string): ChipTone {
  const tone = toneForOutcome(esito);
  return tone === "action" ? "pending" : tone;
}
