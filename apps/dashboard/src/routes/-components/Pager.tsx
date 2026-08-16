import { useT } from "../../i18n/I18nProvider";
import type { Pagination } from "./usePagination";
import { Icon, LabelCaps } from "./ui";

const BUTTON_CLASS =
  "inline-flex items-center gap-1 rounded-sm border border-outline/60 bg-surface-variant/40 px-2 py-1 font-mono text-xs text-foreground transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Controlli di paginazione: pagine numerate su desktop/tablet,
 * "mostra altri" incrementale su phone. Sotto soglia non renderizza nulla.
 */
export function Pager<T>({ state, label }: { state: Pagination<T>; label: string }) {
  const t = useT();
  if (!state.enabled) return null;

  if (state.mode === "more") {
    return (
      <div className="flex items-center justify-between gap-2 pt-2">
        <span className="font-mono text-[11px] text-muted-foreground" role="status">
          {t("xp.pagerShown", { shown: state.items.length, total: state.total })}
        </span>
        {state.hasNext ? (
          <button type="button" className={BUTTON_CLASS} onClick={state.showMore}>
            <Icon name="expand_more" size={16} />
            {t("xp.pagerMore")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <nav
      aria-label={t("xp.pagerLabel", { list: label })}
      className="flex flex-wrap items-center justify-between gap-2 pt-2"
    >
      <span className="flex items-center gap-2" role="status">
        <LabelCaps>{t("xp.pagerPage", { page: state.page, pageCount: state.pageCount })}</LabelCaps>
        <span className="font-mono text-[11px] text-muted-foreground">
          {t("xp.pagerTotal", { total: state.total })}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={state.prev}
          disabled={!state.hasPrev}
        >
          <Icon name="chevron_left" size={16} />
          {t("xp.pagerPrev")}
        </button>
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={state.next}
          disabled={!state.hasNext}
        >
          {t("xp.pagerNext")}
          <Icon name="chevron_right" size={16} />
        </button>
      </span>
    </nav>
  );
}
