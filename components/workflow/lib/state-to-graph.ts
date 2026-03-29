import type { Node, Edge } from "@xyflow/react";
import type { WorkflowState, WorkflowTool } from "@/types/workflow";
import { getAgentStyle } from "./agent-styles";

export const AGENT_NODE_WIDTH = 220;
export const AGENT_NODE_HEIGHT = 130;
export const TOOL_NODE_WIDTH = 160;
export const TOOL_NODE_HEIGHT = 60;

export interface AgentNodeData {
  agent: import("@/types/workflow").WorkflowAgent;
  style: ReturnType<typeof getAgentStyle>;
  [key: string]: unknown;
}

export interface ToolNodeData {
  tool: WorkflowTool;
  parentAgentName: string;
  [key: string]: unknown;
}

/**
 * Builds a sequential chain per agent where actions flow left-to-right:
 *
 *   Agent → tool1 → tool2 → ChildAgent → tool4 → ...
 *
 * - Regular tools become ToolNode
 * - Sub-agent calls (is_agent_call + childAgentId) are replaced by the child AgentNode
 * - Sub-agent calls without childAgentId yet (waiting for agent_start) are skipped
 * - Child agents then recursively have their own chains
 */
export function stateToGraph(state: WorkflowState): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addedAgentIds = new Set<string>();
  const processedAgentIds = new Set<string>();

  function addAgentNode(agentId: string) {
    if (addedAgentIds.has(agentId)) return;
    const agent = state.agents.get(agentId);
    if (!agent) return;
    addedAgentIds.add(agentId);

    nodes.push({
      id: agent.id,
      type: "agentNode",
      position: { x: 0, y: 0 },
      data: { agent, style: getAgentStyle(agent.name) } satisfies AgentNodeData,
      width: AGENT_NODE_WIDTH,
      height: AGENT_NODE_HEIGHT,
    });
  }

  function addEdge(
    sourceId: string,
    targetId: string,
    tool?: WorkflowTool,
    isSubAgent = false
  ) {
    const id = `e-${sourceId}-${targetId}`;
    // Avoid duplicate edges
    if (edges.some((e) => e.id === id)) return;

    const status = tool
      ? tool.status
      : (() => {
          const targetAgent = state.agents.get(targetId);
          if (!targetAgent) return "executing" as const;
          if (targetAgent.status === "completed") return "completed" as const;
          if (targetAgent.status === "error") return "error" as const;
          return "executing" as const;
        })();

    edges.push({
      id,
      source: sourceId,
      target: targetId,
      type: "animatedEdge",
      data: {
        status,
        label: tool?.edgeLabel ? truncate(tool.edgeLabel, 40) : undefined,
        isSubAgentEdge: isSubAgent,
      },
      animated: status === "executing",
    });
  }

  /**
   * Process an agent: create its node and build the sequential chain
   * of its actions (tools + child agents).
   */
  function processAgent(agentId: string) {
    if (processedAgentIds.has(agentId)) return;
    processedAgentIds.add(agentId);

    addAgentNode(agentId);

    // Get this agent's tools in order
    const agentTools = state.tools.filter((t) => t.agentId === agentId);

    let prevNodeId = agentId;

    for (const tool of agentTools) {
      if (tool.isAgentCall) {
        if (tool.childAgentId && state.agents.has(tool.childAgentId)) {
          // Sub-agent call with spawned child — use child agent node
          addAgentNode(tool.childAgentId);
          addEdge(prevNodeId, tool.childAgentId, tool, true);

          // Recursively process the child agent's own chain
          processAgent(tool.childAgentId);

          // Continue chain from the child agent
          prevNodeId = tool.childAgentId;
        }
        // If childAgentId not set yet, skip — will appear once agent_start fires
      } else {
        // Regular tool — create tool node
        const parentAgent = state.agents.get(agentId);
        nodes.push({
          id: tool.id,
          type: "toolNode",
          position: { x: 0, y: 0 },
          data: {
            tool,
            parentAgentName: parentAgent?.name ?? "",
          } satisfies ToolNodeData,
          width: TOOL_NODE_WIDTH,
          height: TOOL_NODE_HEIGHT,
        });

        addEdge(prevNodeId, tool.id, tool);
        prevNodeId = tool.id;
      }
    }
  }

  // Start from root agents (no parent) and recurse
  for (const [agentId, agent] of state.agents) {
    if (!agent.parentId) {
      processAgent(agentId);
    }
  }

  // Process any remaining agents that weren't reached via tool chains
  // (e.g. orphan child agents whose parent tool hasn't linked them)
  for (const [agentId, agent] of state.agents) {
    if (processedAgentIds.has(agentId)) continue;
    processAgent(agentId);

    // Connect orphan to parent if it has one
    if (agent.parentId && addedAgentIds.has(agent.parentId)) {
      addEdge(agent.parentId, agentId, undefined, true);
    }
  }

  return { nodes, edges };
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
