import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import { AGENT_NODE_WIDTH, AGENT_NODE_HEIGHT, TOOL_NODE_WIDTH, TOOL_NODE_HEIGHT } from "./state-to-graph";

/**
 * Applies dagre layout to React Flow nodes and edges.
 * Returns new nodes with calculated positions.
 */
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "LR" | "TB" = "LR"
): Node[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: 80,
    nodesep: 40,
    marginx: 20,
    marginy: 20,
  });

  // Add nodes with their dimensions
  for (const node of nodes) {
    const isAgent = node.type === "agentNode";
    g.setNode(node.id, {
      width: isAgent ? AGENT_NODE_WIDTH : TOOL_NODE_WIDTH,
      height: isAgent ? AGENT_NODE_HEIGHT : TOOL_NODE_HEIGHT,
    });
  }

  // Add edges
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  // Apply calculated positions (dagre gives center coordinates)
  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    const isAgent = node.type === "agentNode";
    const width = isAgent ? AGENT_NODE_WIDTH : TOOL_NODE_WIDTH;
    const height = isAgent ? AGENT_NODE_HEIGHT : TOOL_NODE_HEIGHT;

    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
    };
  });
}
