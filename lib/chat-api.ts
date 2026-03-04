import { authenticatedFetch, authenticatedFetchJson } from "@/lib/api-client";
import type { MediaJob, MediaJobCreate } from "@/types/media-jobs";

// === Types ===

export interface ChatThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant" | "tool_result";
  content: string;
  model: string;
  tool_calls: unknown | null;
  tool_call_id: string | null;
  created_at: string;
}

export interface ChatResponse {
  thread_id: string;
  message: ChatMessageData;
}

export interface SendMessageParams {
  message: string;
  model?: string;
  system_prompt?: string;
  stream?: boolean;
}

export interface CreateThreadParams {
  title: string;
}

export interface StreamChunk {
  content?: string;
  done?: boolean;
  message_id?: string;
}

// === API Functions ===

export async function createThread(params: CreateThreadParams): Promise<ChatThread> {
  return authenticatedFetchJson<ChatThread>("/api/chat/threads", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getThreads(): Promise<ChatThread[]> {
  return authenticatedFetchJson<ChatThread[]>("/api/chat/threads");
}

export async function getThread(threadId: string): Promise<ChatThread> {
  return authenticatedFetchJson<ChatThread>(`/api/chat/threads/${threadId}`);
}

export async function deleteThread(threadId: string): Promise<void> {
  await authenticatedFetchJson(`/api/chat/threads/${threadId}`, {
    method: "DELETE",
  });
}

export async function sendMessage(threadId: string, params: SendMessageParams): Promise<ChatResponse> {
  return authenticatedFetchJson<ChatResponse>(`/api/chat/threads/${threadId}/chat`, {
    method: "POST",
    body: JSON.stringify({ ...params, stream: false }),
  });
}

export async function sendMessageStream(
  threadId: string,
  params: SendMessageParams,
  onChunk: (chunk: StreamChunk) => void,
): Promise<void> {
  const response = await authenticatedFetch(`/api/chat/threads/${threadId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, stream: true }),
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.detail || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("Stream yanıtı alınamadı");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE lines
      const lines = buffer.split("\n");
      // Keep incomplete last line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6); // Remove "data: "
        try {
          const chunk: StreamChunk = JSON.parse(jsonStr);
          onChunk(chunk);
        } catch {
          // Skip malformed chunks
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim().startsWith("data: ")) {
      try {
        const chunk: StreamChunk = JSON.parse(buffer.trim().slice(6));
        onChunk(chunk);
      } catch {
        // Skip
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function getMessages(threadId: string): Promise<ChatMessageData[]> {
  return authenticatedFetchJson<ChatMessageData[]>(`/api/chat/threads/${threadId}/messages`);
}

// === Media Job Functions ===

export async function createMediaJob(threadId: string, data: MediaJobCreate): Promise<MediaJob> {
  return authenticatedFetchJson<MediaJob>(`/api/chat/threads/${threadId}/media/jobs`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMediaJobs(threadId: string): Promise<MediaJob[]> {
  return authenticatedFetchJson<MediaJob[]>(`/api/chat/threads/${threadId}/media/jobs`);
}

export async function getMediaJob(threadId: string, jobId: string): Promise<MediaJob> {
  return authenticatedFetchJson<MediaJob>(`/api/chat/threads/${threadId}/media/jobs/${jobId}`);
}

export async function deleteMediaJob(threadId: string, jobId: string): Promise<void> {
  await authenticatedFetchJson(`/api/chat/threads/${threadId}/media/jobs/${jobId}`, {
    method: "DELETE",
  });
}
