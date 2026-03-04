import { useState, useCallback, useRef } from "react";
import {
  createThread,
  sendMessage as apiSendMessage,
  sendMessageStream as apiSendMessageStream,
  getMessages,
  type ChatThread,
  type ChatMessageData,
  type CreateThreadParams,
  type SendMessageParams,
} from "@/lib/chat-api";

interface UseChatThreadReturn {
  thread: ChatThread | null;
  messages: ChatMessageData[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  initThread: (params: CreateThreadParams) => Promise<ChatThread | null>;
  sendMessage: (params: SendMessageParams, threadIdOverride?: string, stream?: boolean) => Promise<ChatMessageData | null>;
  loadMessages: (threadId: string) => Promise<void>;
  setThread: (thread: ChatThread | null) => void;
  clearError: () => void;
}

export function useChatThread(): UseChatThreadReturn {
  const [thread, setThreadState] = useState<ChatThread | null>(null);
  const threadRef = useRef<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setThread = useCallback((t: ChatThread | null) => {
    threadRef.current = t;
    setThreadState(t);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const initThread = useCallback(async (params: CreateThreadParams): Promise<ChatThread | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const newThread = await createThread(params);
      setThread(newThread);
      setMessages([]);
      return newThread;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Thread oluşturulamadı";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setThread]);

  const loadMessages = useCallback(async (threadId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const msgs = await getMessages(threadId);
      setMessages(msgs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mesajlar yüklenemedi";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    params: SendMessageParams,
    threadIdOverride?: string,
    stream?: boolean
  ): Promise<ChatMessageData | null> => {
    const activeThreadId = threadIdOverride || threadRef.current?.id;
    if (!activeThreadId) {
      setError("Aktif thread yok");
      return null;
    }

    setIsSending(true);
    setError(null);

    // Add optimistic user message
    const tempUserMsg: ChatMessageData = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: params.message,
      model: params.model || "",
      tool_calls: null,
      tool_call_id: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      if (stream) {
        // Streaming mode
        const streamingMsgId = `streaming-${Date.now()}`;
        let fullContent = "";
        let finalMessageId = "";

        // Add empty assistant message that will be filled token by token
        const streamingMsg: ChatMessageData = {
          id: streamingMsgId,
          role: "assistant",
          content: "",
          model: params.model || "",
          tool_calls: null,
          tool_call_id: null,
          created_at: new Date().toISOString(),
        };

        // Replace temp user msg with real one + add streaming placeholder
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
          const realUserMsg: ChatMessageData = {
            ...tempUserMsg,
            id: `user-${Date.now()}`,
          };
          return [...withoutTemp, realUserMsg, streamingMsg];
        });

        await apiSendMessageStream(activeThreadId, params, (chunk) => {
          if (chunk.content) {
            fullContent += chunk.content;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingMsgId
                  ? { ...m, content: fullContent }
                  : m
              )
            );
          }
          if (chunk.done && chunk.message_id) {
            finalMessageId = chunk.message_id;
          }
        });

        // Finalize the streaming message with real ID
        const finalMsg: ChatMessageData = {
          ...streamingMsg,
          id: finalMessageId || streamingMsgId,
          content: fullContent,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === streamingMsgId ? finalMsg : m))
        );

        return finalMsg;
      } else {
        // Non-streaming mode
        const response = await apiSendMessage(activeThreadId, params);

        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
          const realUserMsg: ChatMessageData = {
            id: `user-${Date.now()}`,
            role: "user",
            content: params.message,
            model: response.message.model || params.model || "",
            tool_calls: null,
            tool_call_id: null,
            created_at: tempUserMsg.created_at,
          };
          return [...withoutTemp, realUserMsg, response.message];
        });

        return response.message;
      }
    } catch (err) {
      // Remove optimistic messages on error
      setMessages((prev) => prev.filter((m) =>
        m.id !== tempUserMsg.id && !m.id.startsWith("streaming-")
      ));
      const msg = err instanceof Error ? err.message : "Mesaj gönderilemedi";
      setError(msg);
      return null;
    } finally {
      setIsSending(false);
    }
  }, []);

  return {
    thread,
    messages,
    isLoading,
    isSending,
    error,
    initThread,
    sendMessage,
    loadMessages,
    setThread,
    clearError,
  };
}
