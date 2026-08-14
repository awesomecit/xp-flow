import type { ReactNode } from "react";

import { useT } from "../../i18n/I18nProvider";
import { Icon } from "./ui";

/** Warning non bloccante sulle righe scartate dal parser (arriva in `meta`). */
export function DiscardedBadge({ count }: { count: number | undefined }) {
  const t = useT();
  if (!count || count <= 0) return null;
  return (
    <p
      role="status"
      data-testid="discarded-badge"
      className="mb-4 flex items-center gap-2 rounded-md border border-blocked/40 bg-blocked-surface px-3 py-2 font-mono text-xs text-blocked"
    >
      <Icon name="warning" size={16} />
      {t("xp.discarded", { count })}
    </p>
  );
}

type QueryLike<T> = { isPending: boolean; error: unknown; data: T | undefined };

/**
 * Stati di caricamento/errore comuni a tutte le risorse REST.
 * Ogni pannello ha il suo gate: una risorsa lenta non blocca le altre.
 */
export function FlowGate<T>({
  query,
  children,
  compact = false,
}: {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
  compact?: boolean;
}) {
  const t = useT();

  if (query.isPending)
    return (
      <p role="status" className="font-mono text-sm text-muted-foreground">
        {t("xp.loading")}
      </p>
    );

  if (query.error || query.data === undefined) {
    return (
      <p
        role="alert"
        className={`rounded-md border border-action/50 bg-action-surface px-3 py-2 text-sm text-action ${
          compact ? "" : "mb-3"
        }`}
      >
        {t("xp.errorTitle")}
        {query.error instanceof Error ? `: ${query.error.message}` : ""}
      </p>
    );
  }

  return <>{children(query.data)}</>;
}
