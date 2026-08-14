import { useQuery } from "@tanstack/react-query";

import type { Paginated } from "../../api";
import {
  attentionQueryOptions,
  blockersQueryOptions,
  currentDemoScenario,
  estimatesQueryOptions,
  feedbackQueryOptions,
  flowEventsQueryOptions,
  flowSummaryQueryOptions,
  manualActionsQueryOptions,
  type BlockersArgs,
  type EventsArgs,
  type ListArgs,
  type Read,
} from "../../domain/api";
import type {
  AttentionItemDto,
  EstimateAccuracyDto,
  FlowSummaryDto,
  ManualActionDto,
} from "../../domain/contracts";
import type { FlowEvent } from "../../domain/schema";

/**
 * Un hook per risorsa REST: ogni vista chiede solo ciò che mostra.
 * Lo scenario demo (`?demo=`) fa parte della query key, così gli scenari E2E
 * non condividono cache.
 */
function scenario(): string {
  return currentDemoScenario();
}

export function useFlowSummary() {
  return useQuery<Read<FlowSummaryDto>>(flowSummaryQueryOptions(scenario()));
}

export function useFlowEvents(args: EventsArgs) {
  return useQuery<Read<Paginated<FlowEvent>>>(flowEventsQueryOptions(scenario(), args));
}

export function useAttention(args: ListArgs) {
  return useQuery<Read<Paginated<AttentionItemDto>>>(attentionQueryOptions(scenario(), args));
}

export function useManualActions(args: ListArgs) {
  return useQuery<Read<Paginated<ManualActionDto>>>(manualActionsQueryOptions(scenario(), args));
}

export function useBlockers(args: BlockersArgs) {
  return useQuery<Read<Paginated<FlowEvent>>>(blockersQueryOptions(scenario(), args));
}

export function useFeedback(args: ListArgs) {
  return useQuery<Read<Paginated<FlowEvent>>>(feedbackQueryOptions(scenario(), args));
}

export function useEstimates(args: ListArgs) {
  return useQuery<Read<Paginated<EstimateAccuracyDto>>>(estimatesQueryOptions(scenario(), args));
}
