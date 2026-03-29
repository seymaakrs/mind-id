"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { WorkflowState } from "@/types/workflow";
import { stateToGraph } from "./lib/state-to-graph";
import { applyDagreLayout } from "./lib/workflow-layout";
import { AgentNode } from "./nodes/AgentNode";
import { ToolNode } from "./nodes/ToolNode";
import { AnimatedEdge } from "./edges/AnimatedEdge";

const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
  toolNode: ToolNode,
};

const edgeTypes: EdgeTypes = {
  animatedEdge: AnimatedEdge,
};

interface WorkflowCanvasProps {
  workflowState: WorkflowState;
  isActive: boolean;
}

export function WorkflowCanvas({
  workflowState,
  isActive,
}: WorkflowCanvasProps) {
  const { fitView } = useReactFlow();
  const prevNodeCountRef = useRef(0);

  // Convert state to positioned graph
  const { nodes, edges } = useMemo(() => {
    const graph = stateToGraph(workflowState);
    const positionedNodes = applyDagreLayout(graph.nodes, graph.edges, "LR");
    return { nodes: positionedNodes, edges: graph.edges };
  }, [workflowState]);

  // Auto-fit whenever nodes change (always center)
  useEffect(() => {
    if (nodes.length > 0 && nodes.length !== prevNodeCountRef.current) {
      prevNodeCountRef.current = nodes.length;
      requestAnimationFrame(() => {
        fitView({ duration: 300, padding: 0.15 });
      });
    }
  }, [nodes.length, fitView]);

  // Reset counter when workflow restarts
  useEffect(() => {
    if (!isActive || nodes.length === 0) {
      prevNodeCountRef.current = 0;
    }
  }, [isActive, nodes.length]);

  const isEmpty = nodes.length === 0;

  return (
    <div className="w-full h-full relative">
      {isEmpty ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <div className="text-4xl opacity-30">🔀</div>
            <p className="text-sm">Görev başladığında iş akışı burada görünecek</p>
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll
          zoomOnDoubleClick={false}
          disableKeyboardA11y
          preventScrolling={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="oklch(0.4 0 0 / 0.2)" />
          <Controls
            showInteractive={false}
            className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
          />
          <MiniMap
            className="!bg-card !border-border"
            nodeColor={(node) => {
              if (node.type === "agentNode") {
                const data = node.data as { style?: { color?: string } };
                return data?.style?.color ?? "#666";
              }
              return "#444";
            }}
            maskColor="oklch(0.15 0 0 / 0.7)"
          />
        </ReactFlow>
      )}
    </div>
  );
}
