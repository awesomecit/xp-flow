/**
 * Contratto dati del dominio XP Flow, dichiarato una volta sola con zod.
 *
 * Da qui derivano SIA i tipi TypeScript (`z.infer`) SIA la validazione a runtime:
 * tipo e controllo non possono divergere. È l'unico punto in cui è descritto
 * cosa risponde `GET /api/events`.
 *
 * Tolleranza voluta (requisito di dominio):
 * - campi extra sconosciuti: ignorati (zod li scarta di default);
 * - campi opzionali con tipo sbagliato: ignorati (`.catch(undefined)`);
 * - `ts` non parsabile, `cmd` o `esito` fuori catalogo: riga NON valida.
 */
import { z } from "zod";

export const FLOW_COMMANDS = [
  "brainstorm",
  "sprint",
  "pair-review",
  "retro",
  "manual_done",
  "metodo_feedback",
] as const;

export const FLOW_OUTCOMES = [
  "in_corso",
  "chiuso",
  "azione_manuale",
  "escalation",
  "bloccato",
] as const;

export const flowCommandSchema = z.enum(FLOW_COMMANDS);
export const flowOutcomeSchema = z.enum(FLOW_OUTCOMES);

const timestampSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "timestamp non valido" });

const optionalNumber = z.number().finite().optional().catch(undefined);
const optionalText = z.string().min(1).optional().catch(undefined);

export const flowEventSchema = z.object({
  /** Timestamp ISO 8601 con offset; è anche l'identità dell'evento. */
  ts: timestampSchema,
  cmd: flowCommandSchema,
  issue: optionalNumber,
  /** Story point stimati/dichiarati sull'evento. */
  sp: optionalNumber,
  esito: flowOutcomeSchema.optional(),
  note: optionalText,
  /** Solo per `manual_done`: ts dell'evento `azione_manuale` che chiude. */
  ref: optionalText,
});

/** Payload accettato dall'endpoint: array nudo oppure envelope `{ data: [...] }`. */
export const flowEventsPayloadSchema = z.union([
  z.array(z.unknown()),
  z.object({ data: z.array(z.unknown()) }).transform((value) => value.data),
]);

export type FlowCommand = z.infer<typeof flowCommandSchema>;
export type FlowOutcome = z.infer<typeof flowOutcomeSchema>;
export type FlowEvent = z.infer<typeof flowEventSchema>;
