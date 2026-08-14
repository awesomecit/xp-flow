/**
 * Contratti REST del dominio XP Flow (slice 1: sola lettura).
 *
 * Un endpoint = una risorsa = uno schema. Da questi schemi derivano sia i tipi
 * TypeScript sia la validazione a runtime delle risposte: se il backend cambia
 * forma, la UI se ne accorge subito con un `AppError` di tipo `validation`
 * invece di rompersi in profondità.
 *
 * Endpoint:
 *   GET /api/flow/summary          -> FlowSummaryDto
 *   GET /api/flow/events           -> Paginated<FlowEvent>
 *   GET /api/flow/manual-actions   -> Paginated<ManualActionDto>
 *   GET /api/flow/blockers         -> Paginated<FlowEvent>
 *   GET /api/flow/feedback         -> Paginated<FlowEvent>
 *   GET /api/flow/estimates        -> Paginated<EstimateAccuracyDto>
 */
import { z } from "zod";

import { flowCommandSchema, flowEventSchema, flowOutcomeSchema } from "./schema";

export const PIPELINE_STATUSES = ["todo", "in_corso", "bloccato", "chiuso"] as const;
export const pipelineStatusSchema = z.enum(PIPELINE_STATUSES);

export const activeSprintSchema = z.object({
  issue: z.number(),
  startedAt: z.string(),
  lastUpdate: z.string(),
  spEstimated: z.number(),
  spBurned: z.number(),
  lastOutcome: flowOutcomeSchema.optional(),
  note: z.string().optional(),
});

export const pipelineStageSchema = z.object({
  cmd: flowCommandSchema,
  status: pipelineStatusSchema,
  lastOutcome: flowOutcomeSchema.optional(),
  note: z.string().optional(),
});

export const flowCountsSchema = z.object({
  events: z.number(),
  discardedRows: z.number(),
  manualActions: z.number(),
  blockers: z.number(),
  escalations: z.number(),
  blocked: z.number(),
  methodFeedback: z.number(),
  closedIssues: z.number(),
});

export const flowSummarySchema = z.object({
  activeSprint: activeSprintSchema.nullable(),
  stages: z.array(pipelineStageSchema),
  counts: flowCountsSchema,
  /** Accuratezza media delle stime, 0..1. */
  estimateAccuracy: z.number(),
});

export const ATTENTION_KINDS = ["manual", "blocked", "escalation"] as const;
export const attentionKindSchema = z.enum(ATTENTION_KINDS);

/** Riga della zona "Serve da te": azioni manuali, blocchi ed escalation unificati. */
export const attentionItemSchema = z.object({
  kind: attentionKindSchema,
  ts: z.string(),
  cmd: flowCommandSchema.optional(),
  issue: z.number().optional(),
  note: z.string().optional(),
});

export const manualActionSchema = z.object({
  ts: z.string(),
  issue: z.number().optional(),
  note: z.string().optional(),
});

export const estimateAccuracySchema = z.object({
  issue: z.number(),
  estimated: z.number(),
  burned: z.number(),
  accuracy: z.number(),
});

/** Envelope di collection: la paginazione è responsabilità del server. */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    pageCount: z.number().int().positive(),
  });
}

export const attentionPageSchema = paginatedSchema(attentionItemSchema);
export const flowEventsPageSchema = paginatedSchema(flowEventSchema);
export const manualActionsPageSchema = paginatedSchema(manualActionSchema);
export const estimatesPageSchema = paginatedSchema(estimateAccuracySchema);

export type PipelineStatus = z.infer<typeof pipelineStatusSchema>;
export type ActiveSprintDto = z.infer<typeof activeSprintSchema>;
export type PipelineStageDto = z.infer<typeof pipelineStageSchema>;
export type FlowSummaryDto = z.infer<typeof flowSummarySchema>;
export type AttentionKind = z.infer<typeof attentionKindSchema>;
export type AttentionItemDto = z.infer<typeof attentionItemSchema>;
export type ManualActionDto = z.infer<typeof manualActionSchema>;
export type EstimateAccuracyDto = z.infer<typeof estimateAccuracySchema>;
