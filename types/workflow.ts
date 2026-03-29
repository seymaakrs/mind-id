// Workflow visualization types based on STREAM_EVENTS_SPEC.md

export type AgentStatus =
  | "idle"
  | "thinking"
  | "decided"
  | "executing"
  | "waiting"
  | "completed"
  | "error";

export interface WorkflowAgent {
  id: string; // agent_id e.g. "orchestrator_1"
  name: string; // agent_name e.g. "orchestrator"
  model: string;
  status: AgentStatus;
  parentId: string | null;
  toolsAvailable: string[];
  llmMessages: string[]; // reasoning texts from llm_end
  outputPreview: string | null;
}

export interface WorkflowTool {
  id: string; // "{agent_id}_{tool}_{index}"
  agentId: string; // which agent owns this tool
  tool: string; // tool name
  isAgentCall: boolean;
  status: "executing" | "completed" | "error";
  inputPrompt?: string; // for sub-agent calls
  inputPreview?: Record<string, string>; // for regular tools
  outputPreview?: string;
  edgeLabel?: string;
  durationMs?: number;
  childAgentId?: string; // if is_agent_call, links to spawned agent
  error?: {
    code: string;
    retryable: boolean;
    messageTr: string;
    service?: string;
  };
}

export interface WorkflowState {
  agents: Map<string, WorkflowAgent>;
  tools: WorkflowTool[];
  isComplete: boolean;
  finalResult?: {
    success: boolean;
    output?: string;
    error?: string;
    logPath?: string;
  };
}

export function createInitialWorkflowState(): WorkflowState {
  return {
    agents: new Map(),
    tools: [],
    isComplete: false,
  };
}

// Stream event interface matching STREAM_EVENTS_SPEC.md
export interface StreamEvent {
  type: "progress" | "heartbeat" | "result";
  timestamp: string;

  // progress events
  event?:
    | "agent_start"
    | "llm_start"
    | "llm_end"
    | "tool_start"
    | "tool_end"
    | "tool_error"
    | "agent_end"
    | "handoff";
  message?: string;

  // hierarchy
  agent_id?: string;
  parent_agent_id?: string | null;
  agent_name?: string;

  // node state
  status?: string;

  // agent metadata (agent_start)
  model?: string;
  tools_available?: string[];

  // LLM decision (llm_end)
  tool_calls_planned?: Array<{
    call_id: string;
    tool: string;
    is_agent_call: boolean;
  }>;
  total_input_tokens?: number;
  total_output_tokens?: number;

  // tool execution
  tool?: string;
  is_agent_call?: boolean;
  input_prompt?: string;
  input_preview?: Record<string, string>;
  output_preview?: string;
  edge_label?: string;
  duration_ms?: number;

  // error details
  error_code?: string;
  retryable?: boolean;
  user_message_tr?: string;
  service?: string;

  // handoff
  from_agent_id?: string;
  from_agent_name?: string;
  to_agent_name?: string;

  // result
  success?: boolean;
  output?: string;
  error?: string;
  log_path?: string;
}
