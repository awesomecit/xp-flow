import { createFileRoute } from "@tanstack/react-router";

import { useT } from "../i18n/I18nProvider";
import type { EstimateAccuracyDto } from "../domain/contracts";
import type { FlowEvent } from "../domain/schema";
import { AppShell } from "./-components/AppShell";
import { DiscardedBadge, FlowGate } from "./-components/FlowGate";
import { useBlockers, useEstimates, useFeedback, useFlowSummary } from "./-components/useFlow";
import { useServerPagination } from "./-components/useServerPagination";
import { RemoteList } from "./-components/RemoteList";
import { Chip, LabelCaps, Meter, Panel, formatTs } from "./-components/ui";

export const Route = createFileRoute("/retro")({
  head: () => ({
    meta: [
      { title: "Retro & metodo — XP Flow Monitor" },
      {
        name: "description",
        content:
          "Feedback di metodo accumulati, accuratezza delle stime story point ed escalation registrate dagli agenti.",
      },
      { property: "og:title", content: "Retro & metodo — XP Flow Monitor" },
      {
        property: "og:description",
        content: "Feedback di metodo, accuratezza stime ed escalation del flusso.",
      },
    ],
  }),
  component: RetroPage,
});

function RetroPage() {
  const t = useT();
  const summaryQuery = useFlowSummary();

  const feedbackPager = useServerPagination<FlowEvent>();
  const feedbackQuery = useFeedback(feedbackPager.args);
  const feedback = feedbackPager.bind(feedbackQuery.data?.data);

  const estimatesPager = useServerPagination<EstimateAccuracyDto>();
  const estimatesQuery = useEstimates(estimatesPager.args);
  const estimates = estimatesPager.bind(estimatesQuery.data?.data);

  // Stessa risorsa dei blocchi, filtrata lato server sul solo tipo escalation.
  const escalationPager = useServerPagination<FlowEvent>();
  const escalationQuery = useBlockers({ ...escalationPager.args, kind: "escalation" });
  const escalations = escalationPager.bind(escalationQuery.data?.data);

  const accuracy = Math.round((summaryQuery.data?.data.estimateAccuracy ?? 0) * 100);

  return (
    <AppShell title={t("xp.retroTitle")}>
      <div className="flex flex-col gap-3">
        <DiscardedBadge count={summaryQuery.data?.meta.discardedRows as number | undefined} />

        <div className="grid gap-3 lg:grid-cols-2">
          <Panel
            title={t("xp.retroFeedbackTitle")}
            icon="forum"
            data-testid="retro-feedback"
            aside={<Chip>{feedback.total}</Chip>}
          >
            <FlowGate query={feedbackQuery} compact>
              {() =>
                feedback.total === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("xp.retroFeedbackEmpty")}</p>
                ) : (
                  <RemoteList
                    className="flex flex-col gap-2"
                    state={feedback}
                    label={t("xp.retroFeedbackTitle")}
                  >
                    {(event) => (
                      <li
                        key={event.ts}
                        className="flex flex-col gap-1 rounded-sm border border-outline/50 bg-background/40 p-3"
                      >
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatTs(event.ts)}
                        </span>
                        <p className="text-sm">{event.note ?? event.cmd}</p>
                      </li>
                    )}
                  </RemoteList>
                )
              }
            </FlowGate>
          </Panel>

          <Panel
            title={t("xp.retroAccuracyTitle")}
            icon="target"
            data-testid="retro-accuracy"
            aside={<Chip tone={accuracy >= 80 ? "ok" : "blocked"}>{accuracy}%</Chip>}
          >
            <FlowGate query={estimatesQuery} compact>
              {() => (
                <RemoteList
                  className="flex flex-col gap-3"
                  state={estimates}
                  label={t("xp.retroAccuracyTitle")}
                >
                  {(row) => (
                    <li key={row.issue} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between">
                        <LabelCaps className="text-foreground">
                          {t("xp.sprintIssue", { issue: row.issue })}
                        </LabelCaps>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {t("xp.retroAccuracyRow", {
                            issue: row.issue,
                            estimated: row.estimated,
                            burned: row.burned,
                          })}
                        </span>
                      </div>
                      <Meter value={row.burned} max={row.estimated || row.burned || 1} />
                    </li>
                  )}
                </RemoteList>
              )}
            </FlowGate>
          </Panel>

          <Panel
            className="lg:col-span-2"
            title={t("xp.retroEscalationTitle")}
            icon="priority_high"
            tone={escalations.total > 0 ? "escalation" : "ok"}
            data-testid="retro-escalations"
          >
            <FlowGate query={escalationQuery} compact>
              {() =>
                escalations.total === 0 ? (
                  <p className="text-sm text-ok">{t("xp.retroEscalationEmpty")}</p>
                ) : (
                  <RemoteList
                    className="grid gap-2 md:grid-cols-2"
                    state={escalations}
                    label={t("xp.retroEscalationTitle")}
                  >
                    {(event) => (
                      <li
                        key={`${event.ts}-${event.cmd}`}
                        className="flex flex-col gap-1 rounded-sm border border-escalation/30 bg-background/40 p-3"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <Chip tone="escalation">{event.cmd}</Chip>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {formatTs(event.ts)}
                          </span>
                        </span>
                        <p className="text-sm text-muted-foreground">{event.note ?? event.esito}</p>
                      </li>
                    )}
                  </RemoteList>
                )
              }
            </FlowGate>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
