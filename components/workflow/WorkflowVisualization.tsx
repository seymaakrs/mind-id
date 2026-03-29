"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { useWorkflowState } from "./hooks/useWorkflowState";

interface WorkflowVisualizationProps {
  taskId: string | null;
}

export function WorkflowVisualization({ taskId }: WorkflowVisualizationProps) {
  const { workflowState, isActive } = useWorkflowState(taskId);

  return (
    <ReactFlowProvider>
      <WorkflowCanvas workflowState={workflowState} isActive={isActive} />
    </ReactFlowProvider>
  );
}
