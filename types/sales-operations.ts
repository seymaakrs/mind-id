import { z } from "zod"

export const SalesWorkflowExecutionSchema = z.object({
  nodeId: z.string(),
  n8nWorkflowId: z.string(),
  n8nName: z.string(),
  active: z.boolean(),
  lastExecutionAt: z.string().nullable(),
  lastExecutionStatus: z.enum(["success", "error", "running", "waiting", "unknown"]).nullable(),
  recentLeadWrites: z.number(),
})

export const SalesLeadsSummarySchema = z.object({
  total: z.number(),
  hotCount: z.number(),
  newLast24h: z.number(),
  updatedLastHour: z.number(),
  lastLeadAt: z.string().nullable(),
  byWorkflowId: z.record(z.string(), z.number()),
})

export const SalesActivityEventSchema = z.object({
  at: z.string(),
  message: z.string(),
  nodeId: z.string().optional(),
})

export const SalesOperationsResponseSchema = z.object({
  success: z.literal(true),
  fetchedAt: z.string(),
  configured: z.object({
    nocodb: z.boolean(),
    n8n: z.boolean(),
  }),
  n8nReachable: z.boolean(),
  workflows: z.array(SalesWorkflowExecutionSchema),
  leads: SalesLeadsSummarySchema.nullable(),
  events: z.array(SalesActivityEventSchema),
})

export type SalesWorkflowExecution = z.infer<typeof SalesWorkflowExecutionSchema>
export type SalesLeadsSummary = z.infer<typeof SalesLeadsSummarySchema>
export type SalesActivityEvent = z.infer<typeof SalesActivityEventSchema>
export type SalesOperationsResponse = z.infer<typeof SalesOperationsResponseSchema>
