import { createFileRoute } from "@tanstack/react-router";

import { useT } from "../i18n/I18nProvider";
import type { FlowEvent } from "../domain/schema";
import { AppShell } from "./-components/AppShell";
import { DiscardedBadge, FlowGate } from "./-components/FlowGate";
import { useBlockers, useFlowSummary } from "./-components/useFlow";
import { useServerPagination } from "./-components/useServerPagination";
import { RemoteList } from "./-components/RemoteList";
import { Chip, Icon, LabelCaps, Panel, formatTs, toneForOutcomeNeutral } from "./-components/ui";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — XP Flow Monitor" },
      {
        name: "description",
        content:
          "Stepper brainstorm → sprint → pair-review → retro con evidenza dei blocchi e delle obiezioni della review.",
      },
      { property: "og:title", content: "Pipeline — XP Flow Monitor" },
      {
        property: "og:description",
        content: "Stato di ogni stadio del flusso e dettaglio dei blocchi attivi.",
      },
    ],
  }),
  component: PipelinePage,
});

const STAGE_ICON: Record<string, string> = {
  brainstorm: "lightbulb",
  sprint: "sprint",
  "pair-review": "group",
  retro: "sync",
};

function PipelinePage() {
  const t = useT();
  const summaryQuery = useFlowSummary();
  const pager = useServerPagination<FlowEvent>();
  const blockersQuery = useBlockers(pager.args);
  const blockers = pager.bind(blockersQuery.data?.data);

  return (
    <AppShell title={t("xp.pipelineTitle")}>
      <div className="flex flex-col gap-3">
        <DiscardedBadge count={summaryQuery.data?.meta.discardedRows as number | undefined} />

        <Panel
          title={t("xp.pipelineTitle")}
          icon="account_tree"
          titleId="pipeline-stepper"
          aria-labelledby="pipeline-stepper"
          data-testid="pipeline-stepper"
          aside={
            summaryQuery.data?.data.activeSprint ? (
              <Chip>
                {t("xp.sprintIssue", { issue: summaryQuery.data.data.activeSprint.issue })}
              </Chip>
            ) : null
          }
        >
          <FlowGate query={summaryQuery} compact>
            {(read) => (
              <ol className="flex flex-col gap-3 md:flex-row md:items-stretch">
                {read.data.stages.map((stage, index) => {
                  const tone =
                    stage.status === "chiuso"
                      ? "ok"
                      : stage.status === "bloccato"
                        ? "blocked"
                        : stage.status === "in_corso"
                          ? "default"
                          : "pending";
                  return (
                    <li
                      key={stage.cmd}
                      data-testid={`stage-${stage.cmd}`}
                      data-status={stage.status}
                      className="flex flex-1 items-center gap-3"
                    >
                      <div
                        className={`flex flex-1 flex-col gap-2 rounded-md border border-l-4 bg-background/40 p-4 ${
                          tone === "ok"
                            ? "border-outline/50 border-l-ok"
                            : tone === "blocked"
                              ? "border-blocked/40 border-l-blocked bg-blocked-surface"
                              : tone === "default"
                                ? "border-outline/50 border-l-primary"
                                : "border-outline/40 border-l-outline opacity-70"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon name={STAGE_ICON[stage.cmd] ?? "circle"} size={18} />
                          <LabelCaps className="text-foreground">{stage.cmd}</LabelCaps>
                        </span>
                        <Chip tone={tone}>{stage.status}</Chip>
                        {stage.note ? (
                          <p className="text-sm text-muted-foreground">{stage.note}</p>
                        ) : null}
                      </div>
                      {index < read.data.stages.length - 1 && (
                        <Icon
                          name="chevron_right"
                          size={20}
                          className="hidden text-muted-foreground md:block"
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </FlowGate>
        </Panel>

        <Panel
          title={t("xp.pipelineBlockedTitle")}
          icon="report"
          tone={blockers.total > 0 ? "blocked" : "ok"}
          titleId="pipeline-blockers"
          aria-labelledby="pipeline-blockers"
          data-testid="pipeline-blockers"
        >
          <FlowGate query={blockersQuery} compact>
            {() =>
              blockers.total === 0 ? (
                <p className="text-sm text-ok">{t("xp.pipelineBlockedEmpty")}</p>
              ) : (
                <RemoteList
                  className="grid gap-2 md:grid-cols-2"
                  state={blockers}
                  label={t("xp.pipelineBlockedTitle")}
                >
                  {(event) => (
                    <li
                      key={`${event.ts}-${event.cmd}`}
                      className="flex flex-col gap-2 rounded-sm border border-blocked/30 bg-background/40 p-3"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <Chip tone={toneForOutcomeNeutral(event.esito)}>{event.cmd}</Chip>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatTs(event.ts)}
                        </span>
                      </span>
                      <p className="text-sm font-semibold text-blocked">
                        {event.note ?? event.esito}
                      </p>
                      {event.issue !== undefined ? (
                        <LabelCaps>{t("xp.sprintIssue", { issue: event.issue })}</LabelCaps>
                      ) : null}
                    </li>
                  )}
                </RemoteList>
              )
            }
          </FlowGate>
        </Panel>
      </div>
    </AppShell>
  );
}
