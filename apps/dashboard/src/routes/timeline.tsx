import { createFileRoute } from "@tanstack/react-router";

import { useT } from "../i18n/I18nProvider";
import { FLOW_COMMANDS, FLOW_OUTCOMES, type FlowCommand, type FlowOutcome } from "../domain/events";
import type { FlowEvent } from "../domain/schema";
import { AppShell } from "./-components/AppShell";
import { DiscardedBadge, FlowGate } from "./-components/FlowGate";
import { useFlowEvents } from "./-components/useFlow";
import { usePersistedFilter } from "./-components/usePersistedFilter";
import { useServerPagination } from "./-components/useServerPagination";
import { RemoteList } from "./-components/RemoteList";
import { Chip, Icon, LabelCaps, Panel, formatTs, toneForOutcomeNeutral } from "./-components/ui";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline eventi — XP Flow Monitor" },
      {
        name: "description",
        content:
          "Feed cronologico degli eventi del flusso, filtrabile per comando ed esito, con warning sulle righe di log scartate.",
      },
      { property: "og:title", content: "Timeline eventi — XP Flow Monitor" },
      {
        property: "og:description",
        content: "Feed eventi filtrabile per comando ed esito, con conteggio righe scartate.",
      },
    ],
  }),
  component: TimelinePage,
});

type CmdFilter = FlowCommand | "all";
type OutcomeFilter = FlowOutcome | "all";

function isCmdFilter(value: string): value is CmdFilter {
  return value === "all" || (FLOW_COMMANDS as readonly string[]).includes(value);
}

function isOutcomeFilter(value: string): value is OutcomeFilter {
  return value === "all" || (FLOW_OUTCOMES as readonly string[]).includes(value);
}

const SELECT_CLASS =
  "rounded-sm border border-outline/60 bg-background px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

function TimelinePage() {
  const t = useT();
  // Filtri persistiti (storage) e riflessi in URL: viaggiano al server come query string.
  const [cmd, setCmd] = usePersistedFilter<CmdFilter>("cmd", "xp.timeline.cmd", "all", isCmdFilter);
  const [outcome, setOutcome] = usePersistedFilter<OutcomeFilter>(
    "esito",
    "xp.timeline.esito",
    "all",
    isOutcomeFilter,
  );

  const pager = useServerPagination<FlowEvent>({ param: "page", resetKey: `${cmd}|${outcome}` });
  const query = useFlowEvents({ ...pager.args, cmd, esito: outcome, order: "desc" });
  const page = pager.bind(query.data?.data);

  return (
    <AppShell title={t("xp.timelineTitle")}>
      <div className="flex flex-col gap-3">
        <DiscardedBadge count={query.data?.meta.discardedRows as number | undefined} />

        <Panel
          title="Filtri"
          icon="filter_list"
          aside={
            <span role="status">
              <Chip>{t("xp.timelineCount", { count: page.total })}</Chip>
            </span>
          }
        >
          <form aria-label="Filtri timeline" className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="filter-cmd">
                <LabelCaps>{t("xp.timelineFilterCmd")}</LabelCaps>
              </label>
              <select
                id="filter-cmd"
                className={SELECT_CLASS}
                value={cmd}
                onChange={(e) => setCmd(e.target.value as CmdFilter)}
              >
                <option value="all">{t("xp.timelineAll")}</option>
                {FLOW_COMMANDS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="filter-outcome">
                <LabelCaps>{t("xp.timelineFilterOutcome")}</LabelCaps>
              </label>
              <select
                id="filter-outcome"
                className={SELECT_CLASS}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as OutcomeFilter)}
              >
                <option value="all">{t("xp.timelineAll")}</option>
                {FLOW_OUTCOMES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Panel>

        <FlowGate query={query}>
          {() =>
            page.total === 0 ? (
              <Panel>
                <p
                  data-testid="timeline-empty"
                  className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
                >
                  <Icon name="inbox" size={18} />
                  {t("xp.timelineEmpty")}
                </p>
              </Panel>
            ) : (
              <div className="overflow-hidden rounded-md border border-outline/60 bg-surface">
                <div className="grid grid-cols-12 gap-3 border-b border-outline/40 bg-surface-variant/40 px-4 py-2">
                  <div className="col-span-3 sm:col-span-2">
                    <LabelCaps>Timestamp</LabelCaps>
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <LabelCaps>Cmd</LabelCaps>
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    <LabelCaps>Issue</LabelCaps>
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    <LabelCaps>SP</LabelCaps>
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <LabelCaps>Esito</LabelCaps>
                  </div>
                  <div className="col-span-3 sm:col-span-4">
                    <LabelCaps>Note</LabelCaps>
                  </div>
                </div>
                <RemoteList
                  as="ol"
                  testId="timeline-feed"
                  state={page}
                  label={t("xp.timelineTitle")}
                  pagerClassName="px-4 pb-3"
                >
                  {(event) => (
                    <li
                      key={`${event.ts}-${event.cmd}`}
                      className="grid grid-cols-12 items-center gap-3 border-b border-outline/20 px-4 py-3 last:border-0 hover:bg-surface-variant/30"
                    >
                      <time
                        dateTime={event.ts}
                        className="col-span-3 font-mono text-xs text-muted-foreground sm:col-span-2"
                      >
                        {formatTs(event.ts)}
                      </time>
                      <div className="col-span-3 sm:col-span-2">
                        <Chip>{event.cmd}</Chip>
                      </div>
                      <div className="col-span-1 hidden font-mono text-xs sm:block">
                        {event.issue !== undefined ? `#${event.issue}` : "—"}
                      </div>
                      <div className="col-span-1 hidden font-mono text-xs text-muted-foreground sm:block">
                        {event.sp !== undefined ? event.sp : "—"}
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        {event.esito ? (
                          <Chip tone={toneForOutcomeNeutral(event.esito)}>{event.esito}</Chip>
                        ) : null}
                      </div>
                      <p className="col-span-3 text-sm text-muted-foreground sm:col-span-4">
                        {event.note ?? ""}
                      </p>
                    </li>
                  )}
                </RemoteList>
              </div>
            )
          }
        </FlowGate>
      </div>
    </AppShell>
  );
}
