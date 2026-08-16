import { createFileRoute } from "@tanstack/react-router";

import { useT } from "../i18n/I18nProvider";
import { usePlatform } from "../platform/usePlatform";
import type { AttentionItemDto, FlowSummaryDto } from "../domain/contracts";
import type { FlowEvent } from "../domain/schema";
import { AppShell } from "./-components/AppShell";
import { DiscardedBadge, FlowGate } from "./-components/FlowGate";
import { useAttention, useFlowEvents, useFlowSummary } from "./-components/useFlow";
import { useServerPagination } from "./-components/useServerPagination";
import { RemoteList } from "./-components/RemoteList";
import { Chip, Icon, LabelCaps, Meter, Panel, formatTs, toneForOutcome } from "./-components/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — XP Flow Monitor" },
      {
        name: "description",
        content:
          "Sprint attivo, azioni che richiedono il product owner e metriche north-star della fabbrica software guidata da agenti AI.",
      },
      { property: "og:title", content: "Dashboard — XP Flow Monitor" },
      {
        property: "og:description",
        content: "Sprint attivo, serve-da-te e north-star del flusso di sviluppo.",
      },
    ],
  }),
  component: DashboardPage,
});

const STAGE_ICON: Record<string, string> = {
  brainstorm: "lightbulb",
  sprint: "sprint",
  "pair-review": "group",
  retro: "sync",
};

function DashboardPage() {
  const t = useT();
  const { formFactor } = usePlatform();

  // Una risorsa REST per zona: ognuna carica, fallisce e pagina per conto suo.
  const summaryQuery = useFlowSummary();
  const attentionPager = useServerPagination<AttentionItemDto>();
  const attentionQuery = useAttention(attentionPager.args);
  const recentPager = useServerPagination<FlowEvent>({ pageSize: 5 });
  const recentQuery = useFlowEvents({ ...recentPager.args, order: "desc" });

  const attention = attentionPager.bind(attentionQuery.data?.data);
  const recent = recentPager.bind(recentQuery.data?.data);

  return (
    <AppShell title={t("xp.navDashboard")}>
      <DiscardedBadge count={summaryQuery.data?.meta.discardedRows as number | undefined} />

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          {/* Zona B — Serve da te: unico punto dove la UI chiama l'utente */}
          <Panel
            className="md:col-span-2"
            tone={attention.total > 0 ? "action" : "ok"}
            icon={attention.total > 0 ? "warning" : "check_circle"}
            title={t("xp.attentionTitle")}
            titleId="zone-attention"
            aria-labelledby="zone-attention"
            data-testid="zone-attention"
            aside={
              attention.total > 0 ? (
                <Chip tone="action">{attention.total} pendenti</Chip>
              ) : (
                <Chip tone="ok">0</Chip>
              )
            }
          >
            <FlowGate query={attentionQuery} compact>
              {() =>
                attention.total === 0 ? (
                  <p className="text-sm text-ok">{t("xp.attentionEmpty")}</p>
                ) : (
                  <RemoteList
                    className="flex flex-col gap-2"
                    state={attention}
                    label={t("xp.attentionTitle")}
                  >
                    {(item) => <AttentionRow key={`${item.kind}-${item.ts}`} item={item} />}
                  </RemoteList>
                )
              }
            </FlowGate>
          </Panel>

          {/* Zona A — Sprint attivo */}
          <Panel
            title={t("xp.sprintTitle")}
            titleId="zone-sprint"
            aria-labelledby="zone-sprint"
            data-testid="zone-sprint"
            aside={
              summaryQuery.data?.data.activeSprint ? (
                <Chip tone={toneForOutcome(summaryQuery.data.data.activeSprint.lastOutcome)}>
                  {summaryQuery.data.data.activeSprint.lastOutcome ?? "—"}
                </Chip>
              ) : null
            }
          >
            <FlowGate query={summaryQuery} compact>
              {(read) => <SprintZone summary={read.data} />}
            </FlowGate>
          </Panel>

          {/* Zona C — Pipeline sintetica (desktop/tablet) */}
          {formFactor !== "phone" && (
            <Panel
              title={t("xp.pipelineTitle")}
              icon="account_tree"
              tone={
                summaryQuery.data?.data.stages.some((s) => s.status === "bloccato")
                  ? "blocked"
                  : "default"
              }
            >
              <FlowGate query={summaryQuery} compact>
                {(read) => (
                  <ul className="flex flex-col gap-2">
                    {read.data.stages.map((stage) => (
                      <li
                        key={stage.cmd}
                        className="flex items-center justify-between border-b border-outline/30 pb-2 last:border-0"
                      >
                        <span className="flex items-center gap-2 font-mono text-xs">
                          <Icon name={STAGE_ICON[stage.cmd] ?? "circle"} size={16} />
                          {stage.cmd}
                        </span>
                        <Chip
                          tone={
                            stage.status === "chiuso"
                              ? "ok"
                              : stage.status === "bloccato"
                                ? "blocked"
                                : stage.status === "in_corso"
                                  ? "default"
                                  : "pending"
                          }
                        >
                          {stage.status}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </FlowGate>
            </Panel>
          )}

          {/* Zona D — North-star (nascosta su phone) */}
          {formFactor !== "phone" && (
            <Panel
              className="md:col-span-2"
              title={t("xp.northStarTitle")}
              titleId="zone-northstar"
              aria-labelledby="zone-northstar"
              data-testid="zone-northstar"
              icon="target"
            >
              <FlowGate query={summaryQuery} compact>
                {(read) => (
                  <dl className="grid grid-cols-3 gap-3">
                    <Metric
                      label={t("xp.northStarClosed")}
                      value={String(read.data.counts.closedIssues)}
                    />
                    <Metric
                      label={t("xp.northStarAccuracy")}
                      value={`${Math.round(read.data.estimateAccuracy * 100)}%`}
                    />
                    <Metric
                      label={t("xp.northStarPending")}
                      value={String(read.data.counts.methodFeedback)}
                    />
                  </dl>
                )}
              </FlowGate>
            </Panel>
          )}
        </div>

        {/* Zona E — Timeline laterale (solo desktop largo) */}
        {formFactor !== "phone" && (
          <Panel title={t("xp.timelineTitle")} icon="history" className="hidden xl:flex">
            <FlowGate query={recentQuery} compact>
              {() => (
                <RemoteList
                  as="ol"
                  className="relative flex flex-col before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-outline/40"
                  state={recent}
                  label={t("xp.timelineTitle")}
                >
                  {(event) => (
                    <li key={`${event.ts}-${event.cmd}`} className="relative pb-5 pl-7">
                      <span
                        className={`absolute left-0 top-1 size-4 rounded-full border-2 ${
                          toneForOutcome(event.esito) === "action"
                            ? "border-action bg-action/30"
                            : toneForOutcome(event.esito) === "blocked"
                              ? "border-blocked bg-blocked/30"
                              : toneForOutcome(event.esito) === "ok"
                                ? "border-ok bg-ok/30"
                                : toneForOutcome(event.esito) === "escalation"
                                  ? "border-escalation bg-escalation/30"
                                  : "border-outline bg-surface-variant"
                        }`}
                      />
                      <div className="flex items-baseline justify-between gap-2">
                        <LabelCaps>{event.cmd}</LabelCaps>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatTs(event.ts)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.note ?? event.esito}</p>
                    </li>
                  )}
                </RemoteList>
              )}
            </FlowGate>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-outline/50 bg-background/40 p-3">
      <dt>
        <LabelCaps>{label}</LabelCaps>
      </dt>
      <dd className="mt-1 font-mono text-2xl font-bold">{value}</dd>
    </div>
  );
}

function SprintZone({ summary }: { summary: FlowSummaryDto }) {
  const t = useT();
  const sprint = summary.activeSprint;

  if (!sprint) {
    return (
      <div data-testid="sprint-empty" className="flex flex-col items-start gap-3 py-4">
        <Icon name="package_2" size={32} className="text-muted-foreground" />
        <p className="text-base font-semibold">{t("xp.sprintEmpty")}</p>
        <p className="text-sm text-muted-foreground">{t("xp.sprintEmptyHint")}</p>
        <pre className="w-full rounded-sm border border-outline/60 bg-background p-3 font-mono text-xs text-primary">
          <code>/brainstorm &lt;idea&gt;</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xl font-bold">{t("xp.sprintIssue", { issue: sprint.issue })}</p>
        {sprint.note ? (
          <p className="font-mono text-xs text-muted-foreground">{sprint.note}</p>
        ) : null}
      </div>
      <div>
        <div className="mb-1 flex justify-between">
          <LabelCaps>Story points</LabelCaps>
          <LabelCaps>
            {t("xp.sprintBurn", { burned: sprint.spBurned, estimated: sprint.spEstimated })}
          </LabelCaps>
        </div>
        <Meter value={sprint.spBurned} max={sprint.spEstimated} />
      </div>
    </div>
  );
}

function AttentionRow({ item }: { item: AttentionItemDto }) {
  const t = useT();

  if (item.kind === "manual") {
    return (
      <li
        data-testid="attention-manual"
        className="flex min-w-0 items-start justify-between gap-3 rounded-sm border border-action/25 bg-background/40 p-3"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-semibold break-words">
            {item.note ?? t("xp.attentionManual")}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <Chip tone="action">{t("xp.attentionManual")}</Chip>
            <span className="font-mono text-[11px] text-muted-foreground">{formatTs(item.ts)}</span>
          </span>
        </div>
        <Icon name="check_box_outline_blank" size={20} className="text-muted-foreground" />
      </li>
    );
  }

  if (item.kind === "blocked") {
    return (
      <li
        data-testid="attention-blocked"
        className="flex flex-col gap-1 rounded-sm border border-blocked/30 bg-background/40 p-3"
      >
        <span className="text-sm font-semibold text-blocked">{t("xp.attentionBlocked")}</span>
        <span className="text-sm text-muted-foreground">{item.note ?? item.cmd}</span>
      </li>
    );
  }

  return (
    <li
      data-testid="attention-escalation"
      className="flex flex-col gap-1 rounded-sm border border-escalation/30 bg-background/40 p-3"
    >
      <span className="text-sm font-semibold text-escalation">{t("xp.attentionEscalation")}</span>
      <span className="text-sm text-muted-foreground">{item.note ?? item.cmd}</span>
    </li>
  );
}
